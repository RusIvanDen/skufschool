import { createError } from 'h3'
export function intId(value: unknown, field = 'id') {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: `Некорректный ${field}` })
  return id
}
export function str(value: unknown, field: string, min = 1, max = 5000) {
  if (typeof value !== 'string') throw createError({ statusCode: 400, statusMessage: `${field}: нужна строка` })
  const s = value.trim()
  if (s.length < min) throw createError({ statusCode: 400, statusMessage: `${field}: слишком коротко` })
  if (s.length > max) throw createError({ statusCode: 400, statusMessage: `${field}: слишком длинно` })
  return s
}
export function login(value: string) {
  const v = value.trim().toLowerCase()
  if (!/^[a-z0-9_]{3,32}$/.test(v)) throw createError({ statusCode: 400, statusMessage: 'Логин: 3-32 символа, латиница/цифры/_' })
  return v
}
export function email(value: string) {
  const v = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw createError({ statusCode: 400, statusMessage: 'Некорректная почта' })
  return v
}
export function taskType(value: unknown) {
  const allowed = ['LECTURE','QUESTION','SINGLE_CHOICE','MULTI_CHOICE','CODE','MARKUP'] as const
  if (!allowed.includes(value as any)) throw createError({ statusCode: 400, statusMessage: 'Некорректный тип задания' })
  return value as typeof allowed[number]
}
