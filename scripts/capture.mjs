/**
 * Product shots for the site: the REAL PageTOC UI, rendered by the shipped
 * bundle over a demo article written for this purpose.
 *
 * Not a mockup, and deliberately not one of the repo's saved site snapshots —
 * those are copies of MDN, Wikipedia and friends, and republishing them on a
 * public marketing page would be someone else's content and branding.
 *
 * Run from a checkout of the app repo (it supplies both Playwright and the
 * built bundle):
 *   PAGETOC_REPO=~/Code/SimpleTOC node scripts/capture.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const repo = process.env.PAGETOC_REPO ?? resolve(here, '../../SimpleTOC')

// Playwright comes from the app repo, not from this one: the site has no
// reason to carry a browser automation dependency just to regenerate four
// PNGs. ESM resolves bare specifiers relative to THIS file, so the import has
// to be by path.
const { webkit } = await import(pathToFileURL(resolve(repo, 'node_modules/playwright/index.mjs')).href)
const BUNDLE = resolve(repo, 'PageTOC/Shared (Extension)/Resources/content-bundle.js')
const ARTICLE = 'file://' + resolve(here, 'demo-article.html')
const OUT = resolve(here, '../public/screenshots')

const SETTINGS = { tocDepth: 3, showFloatingBall: true, blockedOrigins: [] }

/** The shipped path: createToc picks panel or ball from the viewport. */
async function mount(page, scrollTo) {
  await page.addScriptTag({ content: readFileSync(BUNDLE, 'utf8') })
  await page.evaluate(async (settings) => {
    const api = window.PageTOC
    window.__toc = api.createToc({
      settings,
      origin: 'https://example.com',
      onDisableSite: () => {},
      localizer: api.createLocalizer('en'),
    })
    await window.__toc.show()
  }, SETTINGS)
  // Let scroll-spy settle on a real position, so the highlight and the
  // progress bar show a mid-document state rather than "0 / n".
  await page.evaluate((y) => window.scrollTo(0, y), scrollTo)
  await page.waitForTimeout(1200)
}

/**
 * The sheet, open. createToc's shadow root is closed (as it must be in
 * production), and Ball exposes closeOverlay() but no opener — the overlay is
 * only reachable by tapping the ball. So this composes the same pieces the
 * shipped code composes, over headings extracted from this very page, in an
 * OPEN root, and taps the real ball. Same components, same CSS, same data.
 */
async function mountSheet(page, scrollTo) {
  await page.addScriptTag({ content: readFileSync(BUNDLE, 'utf8') })
  await page.evaluate((y) => window.scrollTo(0, y), scrollTo)
  await page.evaluate((settings) => {
    const api = window.PageTOC
    const localizer = api.createLocalizer('en')
    const article = api.extractArticle()
    const headings = api.extractHeadings(article)
    const shadow = api.createShadowHost({ mode: 'open' })
    const list = api.renderList(api.buildTree(headings, settings.tocDepth), () => {}, localizer)
    const ball = api.createBall({
      container: shadow.container,
      list,
      position: null,
      onPositionChange: () => {},
      onDisableSite: () => {},
      localizer,
    })
    const active = Math.floor(headings.length / 2)
    api.setActive(list, null, active)
    ball.setProgress(active, headings.length)
    shadow.container.querySelector('.pagetoc-ball').focus()
  }, SETTINGS)
  // Enter on the focused ball, not a synthetic click: the pointer path runs
  // through makeDraggable's onEnd, which a dispatched click never reaches.
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1200)
}

async function shoot({ browser, name, width, height, scheme, scrollTo, sheet }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme: scheme,
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  await page.goto(ARTICLE)
  await (sheet ? mountSheet : mount)(page, scrollTo)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await ctx.close()
  console.log(`  ${name}.png  ${width}x${height} @2x ${scheme}`)
}

const wk = await webkit.launch()
await shoot({ browser: wk, name: 'panel-light', width: 1280, height: 800, scheme: 'light', scrollTo: 1100 })
await shoot({ browser: wk, name: 'panel-dark', width: 1280, height: 800, scheme: 'dark', scrollTo: 1100 })
await shoot({ browser: wk, name: 'ball-light', width: 390, height: 844, scheme: 'light', scrollTo: 1100 })
await shoot({ browser: wk, name: 'sheet-light', width: 390, height: 844, scheme: 'light', scrollTo: 1100, sheet: true })
await shoot({ browser: wk, name: 'sheet-dark', width: 390, height: 844, scheme: 'dark', scrollTo: 1100, sheet: true })
await wk.close()
