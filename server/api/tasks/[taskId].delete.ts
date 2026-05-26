import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/security'
import { intId } from '../../utils/validate'
export default defineEventHandler(async (event) => { await requireAdmin(event); await prisma.task.delete({ where:{ id:intId(getRouterParam(event,'taskId'),'taskId') } }); return { ok:true } })
