import { createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/security'
import { intId, str, taskType } from '../../utils/validate'
import { defaultContent } from '../../utils/task'
export default defineEventHandler(async (event) => { await requireAdmin(event); const id=intId(getRouterParam(event,'taskId'),'taskId'); const current=await prisma.task.findUnique({where:{id}}); if(!current) throw createError({statusCode:404,statusMessage:'Задание не найдено'}); const body=await readBody(event); const type=taskType(body.type||current.type); const content=body.content || (type===current.type ? current.content : defaultContent(type)); return { task: await prisma.task.update({ where:{id}, data:{ type, title:str(body.title||content.title,'Название',2,200), content } }) } })
