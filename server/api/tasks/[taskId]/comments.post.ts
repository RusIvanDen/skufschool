import { readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { requireUser } from '../../../utils/security'
import { intId, str } from '../../../utils/validate'
export default defineEventHandler(async (event) => { const user=await requireUser(event); const body=await readBody(event); return { comment: await prisma.comment.create({ data:{ taskId:intId(getRouterParam(event,'taskId'),'taskId'), userId:user.id, text:str(body.text,'Комментарий',1,2000) }, include:{user:{select:{name:true,login:true}}} }) } })
