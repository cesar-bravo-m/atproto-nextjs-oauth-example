import { getIronSession } from "iron-session";
import { getContext } from "@/instrumentation";
import { cookies } from "next/headers";
import type { Session } from "@/context";

export async function GET(request: Request) {
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
