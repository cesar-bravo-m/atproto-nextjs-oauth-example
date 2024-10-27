'use server'
import { getSessionAgent } from "@/context";
import Login from "./components/login"
import { getContext } from "@/instrumentation";
import * as Profile from '@/lexicon/types/app/bsky/actor/profile'
import Logout from "./components/logout";

export default async function Home() {
  const ctx = getContext()
  const agent = await getSessionAgent(ctx)
  if (!agent) return <Login />
  const handle = await ctx.resolver.resolveDidToHandle(agent.did!)
  const { data: profileRecord} = await agent.com.atproto.repo.getRecord({
    repo: agent.assertDid,
    collection: 'app.bsky.actor.profile',
    rkey: 'self'
  })
  const profile = 
    Profile.isRecord(profileRecord.value) &&
    Profile.validateRecord(profileRecord.value).success
      ? profileRecord.value
      : null
  return <div>
    <p>Logged in as {handle}</p>
    <p>Profile: {profile?.displayName}</p>
    <Logout />
  </div>
}
