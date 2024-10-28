'use server'
import { getSessionAgent } from "@/context";
import Login from "./components/login"
import { getContext } from "@/instrumentation";
import * as Profile from '@/lexicon/types/app/bsky/actor/profile'
import Logout from "./components/logout";

const styles = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '2rem',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
  profileSection: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  handle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    margin: '1rem auto',
    display: 'block',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    objectFit: 'cover' as const,
  },
  displayName: {
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '1.5rem',
  },
  description: {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '1.5rem',
  }
}

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

  return (
    <div style={styles.container}>
      <div style={styles.profileSection}>
        <p style={styles.handle}>{handle}</p>
        {profile?.displayName && (
          <p style={styles.displayName}>{profile.displayName}</p>
        )}
        {profile?.description && (
          <p style={styles.description}>{profile.description}</p>
        )}
        <Logout />
      </div>
    </div>
  )
}
