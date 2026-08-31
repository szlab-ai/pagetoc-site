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
 *
 * ── Why Chromium and not WebKit ──────────────────────────────────────────
 * PageTOC ships in Safari, so WebKit is the obvious engine, and that is what
 * this script used first. But Playwright's headless WebKit reports
 * CSS.supports('backdrop-filter','blur(12px)') === true and then does not
 * rasterize it — measured, not assumed: the same test page renders frosted in
 * Chromium and leaves fully legible text showing through in WebKit, prefixed
 * or not. The panel and the sheet are 94%-opaque surfaces that rely on that
 * blur, so under headless WebKit the article reads straight through the
 * outline. That is a capture artifact, not what a device shows.
 *
 * Chromium composites the same CSS the way real Safari does, so it is the
 * engine that produces a truthful picture here. No product CSS is modified for
 * the screenshots. If Playwright's WebKit ever grows backdrop-filter support,
 * switch back — the only change needed is the import below.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const repo = process.env.PAGETOC_REPO ?? resolve(here, '../../SimpleTOC')

// Playwright comes from the app repo, not from this one: the site has no
// reason to carry a browser automation dependency just to regenerate a handful
// of PNGs. ESM resolves bare specifiers relative to THIS file, so the import
// has to be by path.
const { chromium } = await import(pathToFileURL(resolve(repo, 'node_modules/playwright/index.mjs')).href)
const BUNDLE = resolve(repo, 'PageTOC/Shared (Extension)/Resources/content-bundle.js')
const ARTICLE = 'file://' + resolve(here, 'demo-article.html')
const OUT = resolve(here, '../public/screenshots')

const SETTINGS = { tocDepth: 3, showFloatingBall: true, blockedOrigins: [] }

/** The shipped path: createToc picks panel or ball from the viewport (>700px = panel). */
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
 * The ball, and optionally the sheet it opens.
 *
 * createToc's shadow root is closed (as it must be in production), and Ball
 * exposes closeOverlay() but no opener — the overlay is only reachable by
 * tapping the ball. So this composes the same pieces the shipped code
 * composes, over headings extracted from this very page, in an OPEN root, and
 * taps the real ball. Same components, same CSS, same data.
 *
 * `position` is passed rather than left null because the shipped default
 * corner is computed from env(safe-area-inset-*), and headless Chromium
 * reports those as zero: the ball lands 34pt lower than it does on any iPhone
 * with a home indicator, right where the rounded corner is. The values below
 * are what createBall itself computes on a real device, so this reproduces the
 * product rather than decorating it.
 */
async function mountBall(page, scrollTo, position, open) {
  await page.addScriptTag({ content: readFileSync(BUNDLE, 'utf8') })
  await page.evaluate((y) => window.scrollTo(0, y), scrollTo)
  await page.evaluate(
    ({ settings, position }) => {
      const api = window.PageTOC
      const localizer = api.createLocalizer('en')
      const article = api.extractArticle()
      const headings = api.extractHeadings(article)
      const shadow = api.createShadowHost({ mode: 'open' })
      const list = api.renderList(api.buildTree(headings, settings.tocDepth), () => {}, localizer)
      const ball = api.createBall({
        container: shadow.container,
        list,
        position,
        onPositionChange: () => {},
        onDisableSite: () => {},
        localizer,
      })
      const active = Math.floor(headings.length / 2)
      api.setActive(list, null, active)
      ball.setProgress(active, headings.length)
      shadow.container.querySelector('.pagetoc-ball').focus()
    },
    { settings: SETTINGS, position },
  )
  // Enter on the focused ball, not a synthetic click: the pointer path runs
  // through makeDraggable's onEnd, which a dispatched click never reaches.
  if (open) await page.keyboard.press('Enter')
  await page.waitForTimeout(1200)
}

/**
 * Wrap a finished shot in a device bezel.
 *
 * A neutral rounded frame and nothing else — no drawn status bar, no notch, no
 * home indicator. Those are Apple's UI, and a screenshot that invents them is
 * claiming to show something the capture never contained. The bezel only says
 * "this is a handheld screen", which is true.
 *
 * The two hairlines are not decoration: the bezel is near-black, so on a dark
 * page a dark-mode shot and its frame merge into one shape with no visible
 * screen edge. One hairline inside the bezel and one outside keep both edges
 * readable in either theme.
 *
 * The source PNG is already @2x, so the frame is drawn in the same pixel space
 * and every number here is device pixels: bezel 24 = 12pt.
 */
async function frame(browser, buffer, { bezel, radius }) {
  const meta = pngSize(buffer)
  const w = meta.width
  const h = meta.height
  const page = await (await browser.newContext({
    viewport: { width: w + bezel * 2, height: h + bezel * 2 },
    deviceScaleFactor: 1,
  })).newPage()
  await page.setContent(`<!doctype html><body style="margin:0">
    <div style="width:${w + bezel * 2}px;height:${h + bezel * 2}px;box-sizing:border-box;
                padding:${bezel}px;border-radius:${radius}px;background:#1b1b1e;
                box-shadow:0 ${bezel}px ${bezel * 3}px rgba(0,0,0,.28),
                           0 0 0 1px rgba(255,255,255,.12)">
      <img src="data:image/png;base64,${buffer.toString('base64')}"
           width="${w}" height="${h}"
           style="display:block;border-radius:${radius - bezel}px;
                  box-shadow:0 0 0 2px rgba(255,255,255,.14)">
    </div></body>`)
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))
  const out = await page.screenshot({ omitBackground: true })
  await page.context().close()
  return out
}

/** PNG dimensions from the IHDR chunk — cheaper than pulling in an image lib. */
function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

async function shoot({ browser, name, width, height, scheme, scrollTo, ball, sheet, bezel, radius }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme: scheme,
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  await page.goto(ARTICLE)
  if (ball) await mountBall(page, scrollTo, ball, Boolean(sheet))
  else await mount(page, scrollTo)
  let buffer = await page.screenshot()
  await ctx.close()
  if (bezel) buffer = await frame(browser, buffer, { bezel, radius })
  const { writeFileSync } = await import('node:fs')
  writeFileSync(`${OUT}/${name}.png`, buffer)
  const size = pngSize(buffer)
  console.log(`  ${name}.png  ${size.width}x${size.height}  (${width}x${height} @2x ${scheme}${bezel ? ', framed' : ''})`)
}

const PHONE = { width: 390, height: 844, bezel: 24, radius: 108 }
// Where createBall puts the ball on an iPhone with a home indicator:
// x = 390 - 8 - 48, y = 844 - 34 - 8 - 48. See mountBall for why it is spelled out.
const BALL_DEFAULT = { x: 334, y: 754, edge: 'right' }
// A dragged position, for the shots where the sheet is open. Left at the
// default the ball ends up behind the sheet's bottom-right corner and only a
// sliver of its progress ring shows past the rounded edge — accurate, and it
// reads as a rendering seam. Dragging it is an equally real state: the ball is
// draggable and its position is remembered per site.
const BALL_DRAGGED = { x: 334, y: 120, edge: 'right' }
// iPad Pro 13" landscape, in points. Well over the 700px breakpoint, so it
// gets the panel — which is the whole point of the iPad shot.
//
// 13" rather than the more common 11" (1194x834) for one measured reason: the
// panel is clamped to the viewport with Math.min(articleRect.right + GAP,
// innerWidth - width), so it needs PANEL_MIN_WIDTH + GAP of margin to sit
// beside the text. A 44rem article centred in 1194 leaves 245px and the panel
// ends up over the last words of every line; 1366 leaves 331px and it sits in
// the margin, which is the behaviour the shot is there to show.
const PAD_LANDSCAPE = { width: 1366, height: 1024, bezel: 34, radius: 92 }

const browser = await chromium.launch()
console.log('Mac')
await shoot({ browser, name: 'panel-light', width: 1280, height: 800, scheme: 'light', scrollTo: 1100 })
await shoot({ browser, name: 'panel-dark', width: 1280, height: 800, scheme: 'dark', scrollTo: 1100 })
console.log('iPad')
await shoot({ browser, ...PAD_LANDSCAPE, name: 'ipad-panel-light', scheme: 'light', scrollTo: 1100 })
console.log('iPhone')
await shoot({ browser, ...PHONE, name: 'ball-light', scheme: 'light', scrollTo: 980, ball: BALL_DEFAULT })
await shoot({ browser, ...PHONE, name: 'sheet-light', scheme: 'light', scrollTo: 980, ball: BALL_DRAGGED, sheet: true })
await shoot({ browser, ...PHONE, name: 'sheet-dark', scheme: 'dark', scrollTo: 980, ball: BALL_DRAGGED, sheet: true })
await browser.close()
