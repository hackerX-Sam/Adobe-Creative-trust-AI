/* Headless smoke test: open the app like a real user, capture errors + screenshot. */
import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1400,900'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1400, height: 900 })

const logs = []
page.on('console', (m) => logs.push(`[console.${m.type()}] ${m.text().slice(0, 300)}`))
page.on('pageerror', (e) => logs.push(`[PAGE ERROR] ${String(e).slice(0, 400)}`))
page.on('requestfailed', (r) => logs.push(`[REQ FAIL] ${r.url().slice(0, 120)} → ${r.failure()?.errorText?.slice(0, 60)}`))

await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 45000 })
await new Promise((r) => setTimeout(r, 9000))

const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 600))
await page.screenshot({ path: 'C:/Users/samir/AppData/Local/Temp/opencode/preview_check.png' })

console.log('=== BODY TEXT ===')
console.log(bodyText)
console.log('=== CONSOLE / ERRORS ===')
console.log(logs.slice(0, 25).join('\n'))
await browser.close()
process.exit(0)
