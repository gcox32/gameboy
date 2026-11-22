import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ownsBlobUrl, readBlob } from '@/lib/blob';

// Headers worth passing between the browser and the blob store, both ways
const FORWARDED_REQUEST = ['range', 'if-none-match'];
const FORWARDED_RESPONSE = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];

// GET /api/blob/file?url=<blobUrl>
// Streams one of the signed-in user's files. Streaming keeps large ROMs clear of the
// function response size limit, and being same-origin means the session cookie is the auth.
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = req.nextUrl.searchParams.get('url');
    if (!url) {
        return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }
    if (!ownsBlobUrl(url, session.user) && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const forward = new Headers();
    for (const name of FORWARDED_REQUEST) {
        const value = req.headers.get(name);
        if (value) forward.set(name, value);
    }

    const upstream = await readBlob(url, forward);
    if (!upstream.ok && upstream.status !== 304) {
        return NextResponse.json({ error: 'File not found' }, { status: upstream.status === 404 ? 404 : 502 });
    }

    const headers = new Headers({ 'Cache-Control': 'private, no-cache' });
    for (const name of FORWARDED_RESPONSE) {
        const value = upstream.headers.get(name);
        if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
}
