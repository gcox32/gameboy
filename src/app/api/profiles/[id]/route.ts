import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Profile } from '@/models';
import User from '@/models/User';
import { deleteUser } from '@/lib/userFiles';
import { isValidObjectId } from 'mongoose';

type Params = { params: Promise<{ id: string }> };

// GET /api/profiles/:id — get profile by MongoDB _id
export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await dbConnect();
    const profile = await Profile.findById(id);

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only the profile owner or an admin can view the full profile
    if (profile.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await User.findById(profile.userId).select('admin email');
    return NextResponse.json({ ...profile.toJSON(), email: user?.email ?? profile.email, admin: user?.admin ?? false });
}

// PUT /api/profiles/:id — full update (admin only)
export async function PUT(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await dbConnect();
    const profile = await Profile.findById(id);

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { username, bio, avatar, admin } = body;

    // Email isn't editable here: it's the login, and the user's files are stored under it
    if (body.email !== undefined) {
        return NextResponse.json({ error: "Email can't be changed here" }, { status: 400 });
    }
    const isSelf = profile.userId.toString() === session.user.id;
    if (admin !== undefined && !admin && isSelf) {
        return NextResponse.json({ error: "You can't remove your own admin role" }, { status: 400 });
    }

    if (username !== undefined && (typeof username !== 'string' || !username.trim())) {
        return NextResponse.json({ error: "Username can't be empty" }, { status: 400 });
    }

    if (username !== undefined) profile.username = username.trim();
    if (bio !== undefined) profile.bio = bio;
    if (avatar !== undefined) profile.avatar = avatar;

    await profile.save();

    const user = admin !== undefined
        ? await User.findByIdAndUpdate(profile.userId, { admin: !!admin }, { new: true }).select('admin email')
        : await User.findById(profile.userId).select('admin email');

    return NextResponse.json({ ...profile.toJSON(), email: user?.email ?? profile.email, admin: user?.admin ?? false });
}

// DELETE /api/profiles/:id — admin only
export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await dbConnect();
    const profile = await Profile.findById(id);

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const userId = profile.userId.toString();
    if (userId === session.user.id) {
        return NextResponse.json({ error: "You can't delete your own account here" }, { status: 400 });
    }

    // Everything they own goes with them, so they can't sign in to an empty account
    const removed = await deleteUser(userId);
    return NextResponse.json({ success: true, ...removed });
}
