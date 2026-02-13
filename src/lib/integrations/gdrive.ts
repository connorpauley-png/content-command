/**
 * Google Drive Integration — pure fetch, no SDK
 * All credentials come from env vars or client config.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

// ---------- OAuth ----------

export function getAuthUrl(clientId: string, redirectUri: string, scopes: string[]): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCode(
  code: string, clientId: string, clientSecret: string, redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: redirectUri, grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function refreshAccessToken(
  refreshToken: string, clientId: string, clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken, client_id: clientId,
      client_secret: clientSecret, grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)
  return res.json()
}

// ---------- Helper: auto-refresh wrapper ----------

interface TokenSet { accessToken: string; refreshToken: string }

export async function authedFetch(
  url: string, init: RequestInit, tokens: TokenSet
): Promise<Response> {
  const headers = { ...init.headers as Record<string, string>, Authorization: `Bearer ${tokens.accessToken}` }
  let res = await fetch(url, { ...init, headers })
  if (res.status === 401 && tokens.refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const refreshed = await refreshAccessToken(tokens.refreshToken, clientId, clientSecret)
    tokens.accessToken = refreshed.access_token
    const retryHeaders = { ...init.headers as Record<string, string>, Authorization: `Bearer ${tokens.accessToken}` }
    res = await fetch(url, { ...init, headers: retryHeaders })
  }
  return res
}

// ---------- Files ----------

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  thumbnailLink?: string
  webViewLink?: string
  createdTime?: string
  modifiedTime?: string
  size?: string
}

export async function listFiles(
  accessToken: string, folderId: string, mimeType?: string
): Promise<DriveFile[]> {
  let q = `'${folderId}' in parents and trashed = false`
  if (mimeType) q += ` and mimeType = '${mimeType}'`
  const params = new URLSearchParams({
    q, fields: 'files(id,name,mimeType,thumbnailLink,webViewLink,createdTime,modifiedTime,size)',
    pageSize: '100', orderBy: 'modifiedTime desc',
  })
  const res = await fetch(`${DRIVE_API}/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`listFiles failed: ${await res.text()}`)
  const data = await res.json()
  return data.files ?? []
}

export async function downloadFile(
  accessToken: string, fileId: string
): Promise<{ buffer: ArrayBuffer; mimeType: string; name: string }> {
  // Get metadata first
  const meta = await fetch(`${DRIVE_API}/files/${fileId}?fields=name,mimeType`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!meta.ok) throw new Error(`File metadata failed: ${await meta.text()}`)
  const { name, mimeType } = await meta.json()

  const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Download failed: ${await res.text()}`)
  return { buffer: await res.arrayBuffer(), mimeType, name }
}

export async function uploadFile(
  accessToken: string, folderId: string, fileName: string, mimeType: string, buffer: Buffer
): Promise<DriveFile> {
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] })
  const boundary = '----ContentCommandBoundary'
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${buffer.toString('base64')}\r\n`,
    `--${boundary}--`,
  ].join('')

  const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`)
  return res.json()
}

export async function createFolder(
  accessToken: string, parentId: string, folderName: string
): Promise<DriveFile> {
  const res = await fetch(`${DRIVE_API}/files?fields=id,name,mimeType,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })
  if (!res.ok) throw new Error(`createFolder failed: ${await res.text()}`)
  return res.json()
}

// ---------- Folder structure setup ----------

export async function setupClientFolderStructure(
  accessToken: string, clientName: string, rootFolderId?: string
): Promise<{ rootId: string; clientId: string; folders: Record<string, string> }> {
  // Find or create "Content Command" root
  let rootId = rootFolderId
  if (!rootId) {
    const q = `name = 'Content Command' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    const params = new URLSearchParams({ q, fields: 'files(id)' })
    const res = await fetch(`${DRIVE_API}/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.files?.length) {
      rootId = data.files[0].id
    } else {
      const root = await createFolder(accessToken, 'root', 'Content Command')
      rootId = root.id
    }
  }

  const clientFolder = await createFolder(accessToken, rootId || 'root', clientName)
  const subfolders = ['Assets', 'Generated', 'Before-After', 'Published']
  const folders: Record<string, string> = {}
  for (const name of subfolders) {
    const f = await createFolder(accessToken, clientFolder.id, name)
    folders[name.toLowerCase().replace('-', '_')] = f.id
  }

  return { rootId: rootId || 'root', clientId: clientFolder.id, folders }
}
