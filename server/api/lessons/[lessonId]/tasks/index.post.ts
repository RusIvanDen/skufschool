import { readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { requireAdmin } from '../../../../utils/security'
import { intId, str, taskType } from '../../../../utils/validate'
import { defaultContent } from '../../../../utils/task'
export default defineEventHandler(async (event) => { await requireAdmin(event); const lessonId=intId(getRouterParam(event,'lessonId'),'lessonId'); const body=await readBody(event); const type=taskType(body.type||'LECTURE'); const content=body.content||defaultContent(type); const last=await prisma.task.findFirst({where:{lessonId},orderBy:{sortIndex:'desc'}}); return { task: await prisma.task.create({ data:{ lessonId,type,title:str(body.title||content.title,'Название',2,200),content,sortIndex:(last?.sortIndex||0)+1 } }) } })
