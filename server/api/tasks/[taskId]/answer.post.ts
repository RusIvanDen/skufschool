import { createError, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { requireUser } from '../../../utils/security'
import { intId } from '../../../utils/validate'
import { evaluate } from '../../../utils/task'
import { refreshProgress } from '../../../utils/progress'
export default defineEventHandler(async (event) => { const user=await requireUser(event); const taskId=intId(getRouterParam(event,'taskId'),'taskId'); const body=await readBody(event); const task=await prisma.task.findUnique({where:{id:taskId}}); if(!task) throw createError({statusCode:404,statusMessage:'Задание не найдено'}); const result=evaluate(task.type,task.content,body.answer); if(body.mode!=='check'){ await prisma.taskProgress.upsert({ where:{userId_taskId:{userId:user.id,taskId}}, create:{userId:user.id,taskId,status:result.correct?'SUCCESS':'FAILED'}, update:{status:result.correct?'SUCCESS':'FAILED'} }); if(result.correct) await refreshProgress(user.id, task.lessonId) } return result })
