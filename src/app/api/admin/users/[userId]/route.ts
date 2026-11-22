import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { requireAdmin } from '@/lib/requireAdmin';
import { dbConnect } from '@/lib/db';
import { deleteUser } from '@/lib/userFiles';
import { loadAccountDetail } from '@/lib/adminUsers';
import { recordAudit } from '@/lib/audit';
import { Profile, User } from '@/models';

type Params = { params: Promise<{ userId: string }> };

// GET /api/admin/users/:userId — the account and everything it owns
export async function GET(_req: NextRequest, { params }: Params) {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    const { userId } = await params;
    if (!isValidObjectId(userId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await dbConnect();
    const detail = await loadAccountDetail(userId);
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(detail);
}

// PUT /api/admin/users/:userId — edit the profile and admin role
export async function PUT(req: NextRequest, { params }: Params) {
    const { session, denied } = await requireAdmin();
    if (denied) return denied;

    const { userId } = await params;
    if (!isValidObjectId(userId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { username, bio, admin } = body;

    // Email isn't editable here: it's the login, and the user's files are stored under it
    if (body.email !== undefined) {
        return NextResponse.json({ error: "Email can't be changed here" }, { status: 400 });
    }
    if (username !== undefined && (typeof username !== 'string' || !username.trim())) {
        return NextResponse.json({ error: "Username can't be empty" }, { status: 400 });
    }
    if (admin !== undefined && !admin && userId === session.user.id) {
        return NextResponse.json({ error: "You can't remove your own admin role" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId).select('email admin');
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Before and after of each field that actually changes, for the log
    const profile = await Profile.findOne({ userId }).select('username bio').lean();
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (username !== undefined && username.trim() !== profile?.username) changes.username = { from: profile?.username ?? null, to: username.trim() };
    if (bio !== undefined && bio !== (profile?.bio ?? '')) changes.bio = { from: profile?.bio ?? '', to: bio };
    if (admin !== undefined && !!admin !== !!user.admin) changes.admin = { from: !!user.admin, to: !!admin };

    if (username !== undefined || bio !== undefined) {
        // Creates the profile if the account somehow has none
        await Profile.updateOne(
            { userId },
            {
                $set: { ...(username !== undefined && { username: username.trim() }), ...(bio !== undefined && { bio }) },
                $setOnInsert: { email: user.email, ...(username === undefined && { username: user.email.split('@')[0] }) },
            },
            { upsert: true },
        );
    }
    if (admin !== undefined) {
        user.admin = !!admin;
        await user.save();
    }
    if (Object.keys(changes).length) {
        await recordAudit(session, { action: 'user.update', targetUserId: userId, targetEmail: user.email, details: changes });
    }
    return NextResponse.json({ success: true });
}

// DELETE /api/admin/users/:userId — the account and everything it owns
export async function DELETE(_req: NextRequest, { params }: Params) {
    const { session, denied } = await requireAdmin();
    if (denied) return denied;

    const { userId } = await params;
    if (!isValidObjectId(userId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (userId === session.user.id) {
        return NextResponse.json({ error: "You can't delete your own account here" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId).select('email').lean();
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const removed = await deleteUser(userId);
    await recordAudit(session, { action: 'user.delete', targetUserId: userId, targetEmail: user.email, details: removed });
    return NextResponse.json({ success: true, ...removed });
}
