import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Profile } from '@/models';
import User from '@/models/User';

// GET /api/profiles           — current user's profile
// GET /api/profiles?userId=X  — look up by userId (admin or own)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId && userId !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const targetId = userId ?? session.user.id;
    const profile = await Profile.findOne({ userId: targetId });

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const result = profile.toJSON() as unknown as Record<string, unknown>;
    if (!userId || userId === session.user.id) {
        const user = await User.findById(session.user.id).select('appTrainerId admin');
        if (user?.appTrainerId !== undefined) result.appTrainerId = user.appTrainerId;
        result.admin = user?.admin ?? false;
    }
    return NextResponse.json(result);
}

// PATCH /api/profiles — update current user's profile fields
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { username, bio, avatar } = body;
    if (username !== undefined && (typeof username !== 'string' || !username.trim())) {
        return NextResponse.json({ error: "Username can't be empty" }, { status: 400 });
    }

    await dbConnect();
    const profile = await Profile.findOneAndUpdate(
        { userId: session.user.id },
        { ...(username !== undefined && { username: username.trim() }), ...(bio !== undefined && { bio }), ...(avatar !== undefined && { avatar }) },
        { new: true }
    );

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(profile.toJSON());
}
