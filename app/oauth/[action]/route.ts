import { getIronSession } from "iron-session";
import { getContext } from "@/instrumentation";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Session } from "@/context";

async function oauthCallback(request: Request) {
    const params = new URLSearchParams(request.url.split('?')[1])
    try {
        const { session } = await getContext().oauthClient.callback(params)
        const clientSession = await getIronSession<Session>(await cookies(), {
            cookieName: 'sid',
            password: process.env.COOKIE_SECRET!,
        })
        clientSession.did = session.did
        await clientSession.save()
    } catch (error) {
        console.error("### oauth callback error", error);
    }
    return new Response('<script>window.location.href = "/"</script>', {
        status: 200,
        headers: {
            'Content-Type': 'text/html',
        },
    })
}

async function handleLogin(request: Request) {
    const body = await request.json()
    const handle = body.handle
    if (!handle) return NextResponse.json({ error: 'No handle provided' }, { status: 400 })
    const url = await getContext().oauthClient.authorize(handle, {
        scope: 'atproto transition:generic'
    })
    return NextResponse.json({ redirectUrl: url });
}

async function handleLogout() {
    const session = await getIronSession<Session>(await cookies(), {
        cookieName: 'sid',
        password: process.env.COOKIE_SECRET!,
    })
    session.destroy()
    return Response.json({ success: true })
}

export async function GET(request: Request, { params }: { params: { action: string } }) {
    const { action } = await params
    if (action === 'callback') return oauthCallback(request)
    if (action === 'logout') return handleLogout()
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(request: Request, { params }: { params: { action: string } })  {
    const { action } = await params
    if (action === 'login') return handleLogin(request)
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}