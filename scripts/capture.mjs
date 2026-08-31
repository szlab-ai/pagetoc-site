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
      window.__ball = shadow.container.querySelector('.pagetoc-ball')
    },
    { settings: SETTINGS, position },
  )
  if (open) {
    // Enter on the focused ball, not a synthetic click: the pointer path runs
    // through makeDraggable's onEnd, which a dispatched click never reaches.
    // Then blur — the ball carries no focus style of its own, so it gets the
    // UA's, and Chromium's is a second blue ring right outside the progress
    // ring. A shot of a resting ball should not show a keyboard focus state
    // that only exists because of how this script opened the sheet.
    await page.evaluate(() => window.__ball.focus())
    await page.keyboard.press('Enter')
    await page.evaluate(() => window.__ball.blur())
  }
  await page.waitForTimeout(1200)
}

/**
 * Wrap a finished shot in a device.
 *
 * The bezel, the Dynamic Island, the status bar and the home indicator are
 * drawn here — they are mockup furniture, not capture. The status bar reads
 * 9:41 because that is the time in every Apple mockup ever shipped, and the
 * signal/Wi-Fi/battery glyphs are hand-drawn SVG. None of it comes from a
 * device. What IS real is everything below the status bar: the article, the
 * panel, the sheet, the ball, all rendered by the shipped bundle.
 *
 * The status strip is painted in the page's own background colour rather than
 * left transparent, because that is what the platform does — page content
 * scrolls under the status bar and the bar is composited over it.
 *
 * The source PNG is already @2x, so everything here is written in points and
 * doubled through S(): bezel 12 = 24 device pixels.
 */
const DEVICES = {
  // iPhone 15/16-class: 12pt bezel, 54pt outer corner, Dynamic Island.
  phone: { bezel: 12, radius: 54, island: [126, 37], statusBar: 54, homeBar: 140, statusFont: 15 },
  // iPad Pro: even bezels, no island, a home indicator on the long edge.
  pad: { bezel: 16, radius: 30, statusBar: 34, homeBar: 320, statusFont: 13, camera: true },
  // MacBook Air-shaped: thin even bezel, and a foot below the lid so the
  // silhouette reads as a laptop rather than a monitor.
  //
  // Deliberately no notch. On a real MacBook the notch sits in the menu bar,
  // above the window — drawing one here puts a black bar through the middle of
  // a sentence, and the only way to make it look right is to also draw a menu
  // bar, which means inventing macOS chrome this capture never contained.
  // An unnotched MacBook is a real machine; a notch over body text is not.
  mac: { bezel: 10, radius: 16, foot: 24 },
}

const PAGE_BG = { light: '#ffffff', dark: '#141416' }
const PAGE_FG = { light: '#000000', dark: '#f2f2f7' }

function statusGlyphs(fg, scale) {
  const w = 78 * scale
  const h = 14 * scale
  return `<svg width="${w}" height="${h}" viewBox="0 0 78 14" fill="${fg}" aria-hidden="true">
    <rect x="0" y="9" width="3" height="5" rx="1"/>
    <rect x="5" y="6.5" width="3" height="7.5" rx="1"/>
    <rect x="10" y="4" width="3" height="10" rx="1"/>
    <rect x="15" y="1.5" width="3" height="12.5" rx="1"/>
    <path d="M24.6 4.8a9.6 9.6 0 0 1 12.8 0l-1.7 2a7.1 7.1 0 0 0-9.4 0zM27.9 8.5a5.2 5.2 0 0 1 6.2 0L31 12z"/>
    <rect x="45" y="2.5" width="24" height="11" rx="3.2" fill="none" stroke="${fg}" stroke-opacity=".38" stroke-width="1"/>
    <rect x="46.6" y="4.1" width="18" height="7.8" rx="1.9"/>
    <path d="M70.4 5.9c1 .5 1 2.7 0 3.2z" fill-opacity=".38"/>
  </svg>`
}

async function frame(browser, buffer, { kind, scheme }) {
  const d = DEVICES[kind]
  const { width: w, height: h } = pngSize(buffer)
  const scale = 2
  const S = (pt) => pt * scale
  const bg = PAGE_BG[scheme]
  const fg = PAGE_FG[scheme]

  const lidW = w + S(d.bezel) * 2
  const lidH = h + S(d.bezel) * 2
  const footW = d.foot ? Math.round(lidW * 1.09) : 0
  const footH = d.foot ? S(d.foot) : 0
  const pageW = Math.max(lidW, footW)
  const pageH = lidH + footH

  const statusBar = d.statusBar
    ? `<div style="position:absolute;left:0;right:0;top:0;height:${S(d.statusBar)}px;background:${bg};
                   display:flex;align-items:center;justify-content:space-between;
                   padding:0 ${S(kind === 'phone' ? 28 : 26)}px;box-sizing:border-box">
         <span style="font:600 ${S(d.statusFont)}px/1 -apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;
                      color:${fg};letter-spacing:.2px">9:41</span>
         ${statusGlyphs(fg, scale)}
       </div>`
    : ''

  const island = d.island
    ? `<div style="position:absolute;left:50%;transform:translateX(-50%);top:${S(11)}px;
                   width:${S(d.island[0])}px;height:${S(d.island[1])}px;border-radius:${S(d.island[1] / 2)}px;
                   background:#000"></div>`
    : ''

  const camera = d.camera
    ? `<div style="position:absolute;left:50%;transform:translateX(-50%);top:${S(-d.bezel / 2)}px;
                   width:${S(5)}px;height:${S(5)}px;border-radius:50%;background:#3a3a3e"></div>`
    : ''

  const homeBar = d.homeBar
    ? `<div style="position:absolute;left:50%;transform:translateX(-50%);bottom:${S(7)}px;
                   width:${S(d.homeBar)}px;height:${S(5)}px;border-radius:${S(2.5)}px;
                   background:${scheme === 'dark' ? 'rgba(255,255,255,.62)' : 'rgba(0,0,0,.55)'}"></div>`
    : ''

  const notch = d.notch
    ? `<div style="position:absolute;left:50%;transform:translateX(-50%);top:0;
                   width:${S(d.notch[0])}px;height:${S(d.notch[1])}px;
                   border-radius:0 0 ${S(9)}px ${S(9)}px;background:#1b1b1e"></div>`
    : ''

  // 底座：上窄下宽的梯形 + 中间那道取手凹槽，MacBook 合起来看就是这个轮廓。
  const foot = d.foot
    ? `<div style="width:${footW}px;height:${footH}px;position:relative;
                   background:linear-gradient(#d3d8de 0%,#b3bac2 45%,#868d96 100%);
                   clip-path:polygon(${S(10)}px 0, ${footW - S(10)}px 0, ${footW}px 100%, 0 100%);
                   border-radius:0 0 ${S(6)}px ${S(6)}px">
         <div style="position:absolute;left:50%;transform:translateX(-50%);top:0;
                     width:${S(96)}px;height:${S(7)}px;border-radius:0 0 ${S(7)}px ${S(7)}px;
                     background:#7f868f"></div>
       </div>`
    : ''

  const page = await (await browser.newContext({
    viewport: { width: pageW, height: pageH },
    deviceScaleFactor: 1,
  })).newPage()
  await page.setContent(`<!doctype html><body style="margin:0;display:flex;flex-direction:column;align-items:center">
    <div style="width:${lidW}px;height:${lidH}px;box-sizing:border-box;padding:${S(d.bezel)}px;
                border-radius:${S(d.radius)}px;background:#1b1b1e;position:relative;
                box-shadow:0 ${S(10)}px ${S(30)}px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.12)">
      <div style="position:relative;width:${w}px;height:${h}px;border-radius:${S(d.radius - d.bezel)}px;
                  overflow:hidden;box-shadow:0 0 0 2px rgba(255,255,255,.14)">
        <img src="data:image/png;base64,${buffer.toString('base64')}" width="${w}" height="${h}" style="display:block">
        ${statusBar}${island}${homeBar}${notch}
      </div>
      ${camera}
    </div>
    ${foot}
  </body>`)
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))
  const out = await page.screenshot({ omitBackground: true })
  await page.context().close()
  return out
}

/** PNG dimensions from the IHDR chunk — cheaper than pulling in an image lib. */
function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

async function shoot({ browser, name, device, width, height, scheme, scrollTo, ball, sheet }) {
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
  buffer = await frame(browser, buffer, { kind: device, scheme })
  const { writeFileSync } = await import('node:fs')
  writeFileSync(`${OUT}/${name}.png`, buffer)
  const size = pngSize(buffer)
  console.log(`  ${name}.png  ${size.width}x${size.height}  (${device} ${width}x${height} @2x ${scheme})`)
}

const PHONE = { device: 'phone', width: 390, height: 844 }
const PAD = { device: 'pad', width: 1366, height: 1024 }
const MAC = { device: 'mac', width: 1280, height: 800 }

// Where createBall puts the ball on an iPhone with a home indicator:
// x = 390 - 8 - 48, y = 844 - 34 - 8 - 48. See mountBall for why it is spelled out.
const BALL_DEFAULT = { x: 334, y: 754, edge: 'right' }
// A dragged position, for the shots where the sheet is open. Left at the
// default the ball ends up behind the sheet's bottom-right corner and only a
// sliver of its progress ring shows past the rounded edge — accurate, and it
// reads as a rendering seam. Dragging it is an equally real state: the ball is
// draggable and its position is remembered per site.
const BALL_DRAGGED = { x: 334, y: 150, edge: 'right' }

const browser = await chromium.launch()
console.log('Mac')
await shoot({ browser, ...MAC, name: 'panel-light', scheme: 'light', scrollTo: 1100 })
await shoot({ browser, ...MAC, name: 'panel-dark', scheme: 'dark', scrollTo: 1100 })
console.log('iPad')
await shoot({ browser, ...PAD, name: 'ipad-panel-light', scheme: 'light', scrollTo: 1100 })
console.log('iPhone')
await shoot({ browser, ...PHONE, name: 'ball-light', scheme: 'light', scrollTo: 980, ball: BALL_DEFAULT })
await shoot({ browser, ...PHONE, name: 'sheet-light', scheme: 'light', scrollTo: 980, ball: BALL_DRAGGED, sheet: true })
await shoot({ browser, ...PHONE, name: 'sheet-dark', scheme: 'dark', scrollTo: 980, ball: BALL_DRAGGED, sheet: true })
await browser.close()
