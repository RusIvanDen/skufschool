import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import { createError, deleteCookie, getCookie, setCookie } from 'h3'
import { prisma } from './prisma'

const COOKIE = 'skuf_session'
const DAYS = 30
const sha = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

export type SafeUser = { id: number; name: string; login: string; email: string; role: 'USER' | 'ADMIN' }
export const safeUser = (u: SafeUser): SafeUser => ({ id: u.id, name: u.name, login: u.login, email: u.email, role: u.role })
export const hashPassword = (p: string) => bcrypt.hash(p, 12)
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h)

export async function createSession(event: H3Event, userId: number) {
  const token = crypto.randomBytes(48).toString('base64url')
  await prisma.session.create({ data: { userId, tokenHash: sha(token), expiresAt: new Date(Date.now() + DAYS * 86400_000) } })
  setCookie(event, COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 })
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, COOKIE)
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sha(token) } })
  deleteCookie(event, COOKIE, { path: '/' })
}

export async function currentUser(event: H3Event): Promise<SafeUser | null> {
  const token = getCookie(event, COOKIE)
  if (!token) return null
  const session = await prisma.session.findUnique({ where: { tokenHash: sha(token) }, include: { user: true } })
  if (!session) return null
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null)
    deleteCookie(event, COOKIE, { path: '/' })
    return null
  }
  return safeUser(session.user)
}

export async function requireUser(event: H3Event) {
  const user = await currentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  return user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event)
  if (user.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Доступ только для администратора' })
  return user
}

export function signedToken(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret').update(body).digest('base64url')
  return `${body}.${sig}`
}

export function readSignedToken<T>(token: string): T | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret').update(body).digest('base64url')
  if (sig !== expected) return null
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T } catch { return null }
}
