import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Profile } from '@/models';

type Params = { params: Promise<{ id: string }> };

// GET /api/profiles/:id — get profile by MongoDB _id
export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const profile = await Profile.findById(id);

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only the profile owner or an admin can view the full profile
    if (profile.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(profile.toJSON());
}

// PUT /api/profiles/:id — full update (admin only)
export async function PUT(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const profile = await Profile.findById(id);

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { username, email, bio, avatar, admin } = body;

    if (username !== undefined) profile.username = username;
    if (email !== undefined) profile.email = email;
    if (bio !== undefined) profile.bio = bio;
    if (avatar !== undefined) profile.avatar = avatar;
    if (admin !== undefined) profile.admin = admin;

    await profile.save();
    return NextResponse.json(profile.toJSON());
}

// DELETE /api/profiles/:id — admin only
export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const profile = await Profile.findById(id);

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await profile.deleteOne();
    return NextResponse.json({ success: true });
}
