import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { Session } from "@/context";

export async function GET() {
    const session = await getIronSession<Session>(await cookies(), {
        cookieName: 'sid',
        password: process.env.COOKIE_SECRET!,
    })
    session.destroy()
    return Response.json({ success: true })
}