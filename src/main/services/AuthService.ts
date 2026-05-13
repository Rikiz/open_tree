import { app, shell } from 'electron'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import * as crypto from 'crypto'
import * as https from 'https'
import * as querystring from 'querystring'
import { KeychainService } from './KeychainService'

interface OAuthConfig {
  clientId: string
  authorizeUrl: string
  tokenUrl: string
  apiUrl: string
  redirectUri: string
  scopes: string[]
  state?: string
  codeVerifier?: string
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  scope: string
  expires_in?: number
}

export interface Account {
  id: string
  service: 'github' | 'gitlab' | 'bitbucket'
  username: string
  email: string
  avatarUrl?: string
  tokenExpiresAt?: string
  url?: string
}

const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  github: {
    clientId: 'Iv1.a1b2c3d4e5f6a7b8', // Register your OAuth App at https://github.com/settings/developers
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    apiUrl: 'https://api.github.com',
    redirectUri: 'http://127.0.0.1:19877/callback',
    scopes: ['repo', 'read:org', 'user'],
  },
  gitlab: {
    clientId: 'a1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8a1b2c3d4', // Register at https://gitlab.com/-/profile/applications
    authorizeUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
    apiUrl: 'https://gitlab.com/api/v4',
    redirectUri: 'http://127.0.0.1:19877/callback',
    scopes: ['api', 'read_user'],
  },
  bitbucket: {
    clientId: 'a1b2c3d4e5f6a7b8a1b2', // Register at https://bitbucket.org/account/settings/app-passwords/
    authorizeUrl: 'https://bitbucket.org/site/oauth2/authorize',
    tokenUrl: 'https://bitbucket.org/site/oauth2/access_token',
    apiUrl: 'https://api.bitbucket.org/2.0',
    redirectUri: 'http://127.0.0.1:19877/callback',
    scopes: ['repository', 'account'],
  },
}

export class AuthService {
  private keychain: KeychainService
  private server: ReturnType<typeof createServer> | null = null
  private pendingAuths = new Map<string, { resolve: (account: Account) => void; reject: (error: Error) => void }>()
  private accounts: Map<string, Account> = new Map()

  constructor(keychain: KeychainService) {
    this.keychain = keychain
  }

  async authenticate(service: string, enterpriseUrl?: string): Promise<Account> {
    const config = { ...OAUTH_CONFIGS[service] }
    if (!config) throw new Error(`Unsupported service: ${service}`)

    if (enterpriseUrl) {
      config.authorizeUrl = `${enterpriseUrl}/oauth/authorize`
      config.tokenUrl = `${enterpriseUrl}/oauth/token`
      config.apiUrl = `${enterpriseUrl}/api`
    }

    const state = crypto.randomBytes(16).toString('hex')
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

    config.state = state
    config.codeVerifier = codeVerifier

    await this.ensureServer()

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state,
      response_type: 'code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    const authUrl = `${config.authorizeUrl}?${params.toString()}`

    const promise = new Promise<Account>((resolve, reject) => {
      this.pendingAuths.set(state, { resolve, reject })
    })

    await shell.openExternal(authUrl)

    const account = await promise
    return account
  }

  private async ensureServer(): Promise<void> {
    if (this.server) return

    return new Promise((resolve) => {
      const port = 19877
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.handleCallback(req, res)
      })
      this.server.listen(port, '127.0.0.1', () => resolve())
    })
  }

  private async handleCallback(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '', 'http://127.0.0.1:19877')
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      res.end('<html><body><h3>Authorization failed</h3><p>You can close this window.</p></body></html>')
      const pending = this.pendingAuths.get(state || '')
      if (pending) {
        pending.reject(new Error(error))
        this.pendingAuths.delete(state || '')
      }
      return
    }

    if (code && state) {
      res.end('<html><body><h3>Authorization successful!</h3><p>You can close this window and return to the app.</p></body></html>')

      const pending = this.pendingAuths.get(state)
      if (pending) {
        try {
          const account = await this.exchangeCode(state, code)
          pending.resolve(account)
        } catch (err: any) {
          pending.reject(err)
        } finally {
          this.pendingAuths.delete(state)
        }
      }
    }
  }

  private async exchangeCode(state: string, code: string): Promise<Account> {
    const config = this.getConfigFromState(state)
    if (!config) throw new Error('Invalid state')

    const tokenRes = await this.fetchToken(config, code)
    const token = tokenRes.access_token

    const userInfo = await this.fetchUserInfo(config, token)

    const account: Account = {
      id: `${config.clientId}-${userInfo.id}`,
      service: config === OAUTH_CONFIGS.github ? 'github'
        : config === OAUTH_CONFIGS.gitlab ? 'gitlab'
        : 'bitbucket',
      username: userInfo.username,
      email: userInfo.email || '',
      avatarUrl: userInfo.avatarUrl,
      tokenExpiresAt: tokenRes.expires_in
        ? new Date(Date.now() + tokenRes.expires_in * 1000).toISOString()
        : undefined,
    }

    // Store token securely
    await this.keychain.setPassword('oauth', account.id, JSON.stringify({ token }))

    this.accounts.set(account.id, account)
    return account
  }

  private getConfigFromState(state: string): OAuthConfig | null {
    for (const key of Object.keys(OAUTH_CONFIGS)) {
      const cfg = OAUTH_CONFIGS[key]
      if (cfg.state === state) return cfg
    }
    return null
  }

  private fetchToken(config: OAuthConfig, code: string): Promise<TokenResponse> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        client_id: config.clientId,
        code,
        code_verifier: config.codeVerifier,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      })

      const tokenUrl = new URL(config.tokenUrl)
      const isHttps = tokenUrl.protocol === 'https:'
      const http = isHttps ? https : require('http')

      const options = {
        hostname: tokenUrl.hostname,
        port: tokenUrl.port || (isHttps ? 443 : 80),
        path: tokenUrl.pathname + tokenUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      }

      const req = http.request(options, (res: any) => {
        let data = ''
        res.on('data', (chunk: string) => { data += chunk })
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              reject(new Error(parsed.error_description || parsed.error))
            } else {
              resolve(parsed)
            }
          } catch {
            reject(new Error('Failed to parse token response'))
          }
        })
      })

      req.on('error', reject)
      req.write(postData)
      req.end()
    })
  }

  private fetchUserInfo(config: OAuthConfig, token: string): Promise<{ id: string; username: string; email: string; avatarUrl: string }> {
    return new Promise((resolve, reject) => {
      const apiUrl = new URL(config.apiUrl)
      const isHttps = apiUrl.protocol === 'https:'
      const http = isHttps ? https : require('http')

      let path = '/user'
      if ('github' === this.getServiceName(config)) {
        path = '/user'
      } else if ('gitlab' === this.getServiceName(config)) {
        path = '/user'
      } else if ('bitbucket' === this.getServiceName(config)) {
        path = '/user'
      }

      const options = {
        hostname: apiUrl.hostname,
        port: apiUrl.port || (isHttps ? 443 : 80),
        path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'sourcetree-clone',
          'Accept': 'application/json',
        },
      }

      const req = http.request(options, (res: any) => {
        let data = ''
        res.on('data', (chunk: string) => { data += chunk })
        res.on('end', () => {
          try {
            const user = JSON.parse(data)
            resolve({
              id: String(user.id),
              username: user.login || user.username,
              email: user.email || '',
              avatarUrl: user.avatar_url || '',
            })
          } catch {
            reject(new Error('Failed to parse user info'))
          }
        })
      })

      req.on('error', reject)
      req.end()
    })
  }

  private getServiceName(config: OAuthConfig): string {
    if (config === OAUTH_CONFIGS.github) return 'github'
    if (config === OAUTH_CONFIGS.gitlab) return 'gitlab'
    if (config === OAUTH_CONFIGS.bitbucket) return 'bitbucket'
    return ''
  }

  async getToken(accountId: string): Promise<string | null> {
    const data = await this.keychain.getPassword('oauth', accountId)
    if (!data) return null
    try {
      const { token } = JSON.parse(data)
      return token
    } catch {
      return null
    }
  }

  async removeAccount(accountId: string): Promise<void> {
    await this.keychain.deletePassword('oauth', accountId)
    this.accounts.delete(accountId)
  }

  listAccounts(): Account[] {
    return Array.from(this.accounts.values())
  }

  dispose(): void {
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }
}
