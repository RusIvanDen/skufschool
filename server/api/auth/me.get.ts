import { currentUser } from '../../utils/security'
export default defineEventHandler(async (event) => ({ user: await currentUser(event) }))
