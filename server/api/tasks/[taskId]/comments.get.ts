import { prisma } from '../../../utils/prisma'
import { requireUser } from '../../../utils/security'
import { intId } from '../../../utils/validate'
export default defineEventHandler(async (event) => { await requireUser(event); const taskId=intId(getRouterParam(event,'taskId'),'taskId'); return { comments: await prisma.comment.findMany({ where:{taskId}, orderBy:{createdAt:'asc'}, include:{user:{select:{name:true,login:true}}} }) } })
