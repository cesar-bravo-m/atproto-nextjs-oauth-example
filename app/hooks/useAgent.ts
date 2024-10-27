import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { useEffect, useState } from "react";

type Session = {
    did: string
}

function useAgent() {
    const [did, setDid] = useState<string | null>(null)
    useEffect(() => {
        const getDid = async () => {
            const clientSession = await getIronSession<Session>(await cookies(), {
                cookieName: 'sid',
                password: process.env.COOKIE_SECRET!,
            })
            return clientSession.did
        }
        getDid().then(setDid)
    }, [])
    return did
}

export default useAgent
