import { readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/security'
import { intId, str } from '../../utils/validate'
export default defineEventHandler(async (event) => { await requireAdmin(event); const body=await readBody(event); const id=intId(getRouterParam(event,'courseId'),'courseId'); return { course: await prisma.course.update({ where:{id}, data:{ title:str(body.title,'Название',2,200), description:str(body.description,'Описание',1,5000) } }) } })
