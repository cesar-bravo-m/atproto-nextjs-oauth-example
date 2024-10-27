import { createDb, migrateToLatest, Database } from '@/db'
import { Firehose } from '@atproto/sync'
import { pino } from 'pino'
import type { OAuthClient } from '@atproto/oauth-client-node'
import { NodeOAuthClient } from '@atproto/oauth-client-node'
import { IdResolver, MemoryCache } from '@atproto/identity'
import { cookies } from 'next/headers'
import { Agent } from '@atproto/api'
import * as Status from '@/lexicon/types/xyz/statusphere/status'

type Session = { did: string }

const HOUR = 60e3 * 60
const DAY = HOUR * 24

export function createIdResolver() {
  return new IdResolver({
    didCache: new MemoryCache(HOUR, DAY),
  })
}

export interface BidirectionalResolver {
  resolveDidToHandle(did: string): Promise<string>
  resolveDidsToHandles(dids: string[]): Promise<Record<string, string>>
}

export function createBidirectionalResolver(resolver: IdResolver) {
  return {
    async resolveDidToHandle(did: string): Promise<string> {
      const didDoc = await resolver.did.resolveAtprotoData(did)
      const resolvedHandle = await resolver.handle.resolve(didDoc.handle)
      if (resolvedHandle === did) {
        return didDoc.handle
      }
      return did
    },

    async resolveDidsToHandles(
      dids: string[]
    ): Promise<Record<string, string>> {
      const didHandleMap: Record<string, string> = {}
      const resolves = await Promise.all(
        dids.map((did) => this.resolveDidToHandle(did).catch(() => did))
      )
      for (let i = 0; i < dids.length; i++) {
        didHandleMap[dids[i]] = resolves[i]
      }
      return didHandleMap
    },
  }
}

import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from '@atproto/oauth-client-node'
import { getIronSession } from 'iron-session'

export class StateStore implements NodeSavedStateStore {
  constructor(private db: Database) {}
  async get(key: string): Promise<NodeSavedState | undefined> {
    const result = await this.db.selectFrom('auth_state').selectAll().where('key', '=', key).executeTakeFirst()
    if (!result) return
    return JSON.parse(result.state) as NodeSavedState
  }
  async set(key: string, val: NodeSavedState) {
    const state = JSON.stringify(val)
    await this.db
      .insertInto('auth_state')
      .values({ key, state })
      .onConflict((oc) => oc.doUpdateSet({ state }))
      .execute()
  }
  async del(key: string) {
    await this.db.deleteFrom('auth_state').where('key', '=', key).execute()
  }
}

export class SessionStore implements NodeSavedSessionStore {
  constructor(private db: Database) {
  }
  async get(key: string): Promise<NodeSavedSession | undefined> {
    const result = await this.db.selectFrom('auth_session').selectAll().where('key', '=', key).executeTakeFirst()
    if (!result) return
    return JSON.parse(result.session) as NodeSavedSession
  }
  async set(key: string, val: NodeSavedSession) {
    const session = JSON.stringify(val)
    await this.db
      .insertInto('auth_session')
      .values({ key, session })
      .onConflict((oc) => oc.doUpdateSet({ session }))
      .execute()
  }
  async del(key: string) {
    await this.db.deleteFrom('auth_session').where('key', '=', key).execute()
  }
}

export const createClient = async (db: Database, stateStore: StateStore, sessionStore: SessionStore) => {
    const publicUrl = process.env.PUBLIC_URL
    const url = publicUrl || `http://127.0.0.1:${process.env.PORT}`
    const enc = encodeURIComponent
    return new NodeOAuthClient({
        clientMetadata: {
            client_name: 'AT Protocol Express App',
            client_id: publicUrl
                ? `${url}/client-metadata.json`
                : `http://localhost?redirect_uri=${enc(`${url}/oauth/callback`)}&scope=${enc('atproto transition:generic')}`,
            client_uri: url,
            redirect_uris: [`${url}/oauth/callback`],
            scope: 'atproto transition:generic',
            grant_types: ['authorization_code', 'refresh_token'],
            response_types: ['code'],
            application_type: 'web',
            token_endpoint_auth_method: 'none',
            dpop_bound_access_tokens: true,
        },
        stateStore,
        sessionStore,
    })
}

export type AppContext = {
    db: Database
    ingester: Firehose
    logger: pino.Logger
    oauthClient: OAuthClient
    resolver: BidirectionalResolver
}

export function createIngester(db: Database, idResolver: IdResolver) {
  const logger = pino({ name: 'firehose ingestion' })
  return new Firehose({
    idResolver,
    handleEvent: async (evt) => {
      // Watch for write events
      if (evt.event === 'create' || evt.event === 'update') {
        const now = new Date()
        const record = evt.record

        // If the write is a valid status update
        if (
          evt.collection === 'xyz.statusphere.status' &&
          Status.isRecord(record) &&
          Status.validateRecord(record).success
        ) {
          // Store the status in our SQLite
          await db
            .insertInto('status')
            .values({
              uri: evt.uri.toString(),
              authorDid: evt.did,
              status: record.status,
              createdAt: record.createdAt,
              indexedAt: now.toISOString(),
            })
            .onConflict((oc) =>
              oc.column('uri').doUpdateSet({
                status: record.status,
                indexedAt: now.toISOString(),
              })
            )
            .execute()
        }
      } else if (
        evt.event === 'delete' &&
        evt.collection === 'xyz.statusphere.status'
      ) {
        // Remove the status from our SQLite
        await db.deleteFrom('status').where('uri', '=', evt.uri.toString()).execute()
      }
    },
    onError: (err) => {
      logger.error({ err }, 'error on firehose ingestion')
    },
    filterCollections: ['xyz.statusphere.status'],
    excludeIdentity: true,
    excludeAccount: true,
  })
}


export const createContext = async (DB_PATH: string) => {
    const logger = pino({ name: 'server start' })
    const db = createDb(DB_PATH)
    await migrateToLatest(db)
    const stateStore = new StateStore(db)
    const sessionStore = new SessionStore(db)
    const oauthClient = await createClient(db, stateStore, sessionStore)
    const baseIdResolver = createIdResolver()
    const ingester = createIngester(db, baseIdResolver)
    const resolver = createBidirectionalResolver(baseIdResolver)

    ingester.start()

    return {
        db,
        ingester,
        logger,
        oauthClient,
        resolver
    }
}

export async function getSessionAgent(ctx: AppContext) {
    if (!process.env.COOKIE_SECRET) throw new Error('COOKIE_SECRET is not set')
    const session = await getIronSession<Session>(await cookies(), {
        cookieName: 'sid',
        password: process.env.COOKIE_SECRET,
    })
    if (!session.did) return null
    try {
        const oauthSession = await ctx.oauthClient.restore(session.did)
        return oauthSession ? new Agent(oauthSession) : null
    } catch (err) {
        ctx.logger.warn({ err }, 'oauth restore failed')
        session.destroy()
        return null
    }
}