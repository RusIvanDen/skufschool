import { destroySession } from '../../utils/security'
export default defineEventHandler(async (event) => { await destroySession(event); return { ok: true } })
