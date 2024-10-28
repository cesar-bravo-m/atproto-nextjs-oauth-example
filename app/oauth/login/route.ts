import { NextResponse } from "next/server";
import { getContext } from "@/instrumentation";

export async function POST(request: Request) {
    const body = await request.json()
    const handle = body.handle
    if (!handle) return NextResponse.json({ error: 'No handle provided' }, { status: 400 })
    const url = await getContext().oauthClient.authorize(handle, {
        scope: 'atproto transition:generic'
    })
    return NextResponse.json({ redirectUrl: url });
}