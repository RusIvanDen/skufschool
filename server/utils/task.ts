import vm from 'node:vm'
import { Window } from 'happy-dom'

export const defaultContent = (type: string) => {
  if (type === 'LECTURE') return { title: 'Лекция', text: 'Текст лекции.' }
  if (type === 'QUESTION') return { title: 'Вопрос', text: 'Введите ответ.', answers: ['ответ'] }
  if (type === 'SINGLE_CHOICE') return { title: 'Тест', text: 'Выберите один вариант.', options: [{ id: 'a', text: 'Верно', correct: true }, { id: 'b', text: 'Неверно', correct: false }] }
  if (type === 'MULTI_CHOICE') return { title: 'Тест', text: 'Выберите все верные варианты.', options: [{ id: 'a', text: 'Верно 1', correct: true }, { id: 'b', text: 'Верно 2', correct: true }, { id: 'c', text: 'Неверно', correct: false }] }
  if (type === 'CODE') {
    return {
      title: 'Код',
      text: 'Напишите solution(a, b), возвращающую сумму.',
      functionName: 'solution',
      starterCode: `function solution(a, b) {
  return a + b
}`,
      visibleTests: 5,
      tests: [{ args: [1, 2], expected: 3 }, { args: [10, 5], expected: 15 }]
    }
  }
  return {
    title: 'Вёрстка',
    text: 'Добавьте h1 с текстом SkufSchool.',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>Задание</title>
</head>
<body>
    <script src="script.js"></script>
</body>
</html>`,
    css: '',
    js: '',
    checks: [
      { id: 'h1', title: 'Есть h1', type: 'selectorExists', selector: 'h1' },
      { id: 'txt', title: 'h1 = SkufSchool', type: 'textEquals', selector: 'h1', expected: 'SkufSchool' }
    ]
  }
}

export const publicContent = (type: string, content: any) => {
  if (type === 'QUESTION') { const { answers, ...rest } = content; return rest }
  if (type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE') return { ...content, options: [...(content.options || [])].sort(() => Math.random() - .5).map((o:any) => ({ id: o.id, text: o.text })) }
  if (type === 'CODE') return { ...content, tests: (content.tests || []).slice(0, Number(content.visibleTests || 5)).map((t:any) => ({ args: t.args, expected: t.expected })) }
  return content
}
const norm = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export function evaluate(type: string, content: any, answer: any) {
  if (type === 'LECTURE') return { correct: true }
  if (type === 'QUESTION') return { correct: (content.answers || []).some((x:any) => norm(x) === norm(answer?.text)) }
  if (type === 'SINGLE_CHOICE') return { correct: Boolean((content.options || []).find((o:any) => o.id === answer?.optionId)?.correct) }
  if (type === 'MULTI_CHOICE') {
    const got = new Set(Array.isArray(answer?.optionIds) ? answer.optionIds : [])
    const right = (content.options || []).filter((o:any) => o.correct).map((o:any) => o.id)
    return { correct: got.size === right.length && right.every((id:string) => got.has(id)) }
  }
  if (type === 'CODE') return evalCode(content, String(answer?.code || ''))
  return evalMarkup(content, answer || {})
}

function evalCode(content: any, code: string) {
  const tests = Array.isArray(content.tests) ? content.tests : []
  const visible = Number(content.visibleTests || 5)
  let passedCount = 0
  const visibleResults: any[] = []
  for (const test of tests) {
    let actual: unknown; let ok = false
    try {
      const sandbox: any = { Math, JSON, Number, String, Boolean, Array, Object, console: { log() {} }, __args: Array.isArray(test.args) ? test.args : [] }
      actual = new vm.Script(`${code}\n;${content.functionName || 'solution'}(...__args)`).runInContext(vm.createContext(sandbox), { timeout: 1000 })
      ok = eq(actual, test.expected)
    } catch (e:any) { actual = e?.message || String(e) }
    if (ok) passedCount++
    if (visibleResults.length < visible) visibleResults.push({ args: test.args, expected: test.expected, actual, ok })
  }
  const failedCount = tests.length - passedCount
  return { correct: tests.length > 0 && failedCount === 0, passedCount, failedCount, visibleResults, message: failedCount ? `Ошибка! ${failedCount} тестов пройдено ошибочно!` : 'Все тесты пройдены' }
}

const noComments = (html:string) => html.replace(/<!--[\s\S]*?-->/g, '')
const cssOn = (html:string) => /<link\b(?=[^>]*rel=["']stylesheet["'])(?=[^>]*href=["']style\.css["'])[^>]*>/i.test(noComments(html))
const jsOn = (html:string) => /<script\b(?=[^>]*src=["']script\.js["'])[^>]*>\s*<\/script>/i.test(noComments(html))
function evalMarkup(content: any, answer: any) {
  const html = String(answer.html ?? content.html ?? '')
  const css = cssOn(html) ? String(answer.css ?? '') : ''
  const js = jsOn(html) ? String(answer.js ?? '') : ''
  const window = new Window({ url: 'http://localhost/' })
  const doc = window.document
  doc.open(); doc.write(html); doc.close()
  if (css) { const style = doc.createElement('style'); style.textContent = css; doc.head.appendChild(style) }
  if (js) { try { window.eval(js) } catch {} }
  const checks = (content.checks || []).map((c:any) => {
    let ok = false
    if (c.type === 'selectorExists') ok = Boolean(doc.querySelector(c.selector))
    if (c.type === 'textEquals') ok = norm(doc.querySelector(c.selector)?.textContent) === norm(c.expected)
    if (c.type === 'attributeEquals') ok = doc.querySelector(c.selector)?.getAttribute(c.attribute) === c.expected
    if (c.type === 'cssPropertyEquals') ok = String(window.getComputedStyle(doc.querySelector(c.selector) as any).getPropertyValue(c.property)).trim() === String(c.expected).trim()
    return { ...c, ok }
  })
  const failedCount = checks.filter((c:any) => !c.ok).length
  return { correct: checks.length > 0 && failedCount === 0, checks, failedCount, message: failedCount ? `Ошибка! ${failedCount} проверок не пройдено!` : 'Все проверки пройдены' }
}
