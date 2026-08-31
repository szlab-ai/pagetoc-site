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
 * Composite a finished shot into a real device frame.
 *
 * The frames in scripts/frames/ are photographic-quality machine renders from
 * Facebook (Meta) Design — the same set `fastlane frameit` downloads — not
 * shapes drawn here. See scripts/frames/README.md for provenance and the
 * licence note. Buttons, bezel curvature and the Dynamic Island all come from
 * the frame, which is composited ON TOP of the capture.
 *
 * `screenRadius` is not decoration. The frame's screen aperture is a hole in
 * an otherwise opaque PNG, and a browser capture has square corners, so
 * without it the four corners of the shot poke out past the bezel curve as
 * white right angles. The values are measured off each frame's own alpha
 * channel (first fully-transparent pixel per row, fitted to a circle): 170px
 * for the iPhone, 38px for the iPad, 0 for the MacBook, whose aperture really
 * is square. The container behind is black so a sub-pixel disagreement between
 * my radius and the frame's reads as bezel rather than as a bright seam.
 *
 * Each device's viewport is chosen so the capture lands on the frame's screen
 * area 1:1 with no resampling — iPhone 16 is 393x852@3x = 1179x2556, iPad Pro
 * 12.9" is 1366x1024@2x = 2732x2048, MacBook Air is 1280x800@2x = 2560x1600.
 * Change a viewport and the shot gets rescaled into the frame; change both
 * together or not at all.
 *
 * Still drawn here, over the capture and under the frame: the status bar
 * (9:41, and hand-drawn signal/Wi-Fi/battery glyphs) and the home indicator.
 * Those are software, so no hardware frame can supply them. The status strip
 * is painted in the page's own background colour because that is what the
 * platform does — content scrolls under the status bar and the bar is
 * composited over it.
 */
const DEVICES = {
  phone: {
    file: 'Apple iPhone 16 Black.png',
    screen: { x: 90, y: 90, w: 1179, h: 2556 },
    screenRadius: 170,
    viewport: { width: 393, height: 852, scale: 3 },
    statusBar: 54, statusFont: 15, homeBar: 140,
  },
  pad: {
    file: 'Apple iPad Pro (12.9-inch) (4th generation) Space Gray Landscape.png',
    screen: { x: 96, y: 96, w: 2732, h: 2048 },
    screenRadius: 38,
    viewport: { width: 1366, height: 1024, scale: 2 },
    statusBar: 34, statusFont: 13, homeBar: 320,
  },
  mac: {
    file: 'Apple MacBook Air Space Gray.png',
    screen: { x: 373, y: 123, w: 2560, h: 1600 },
    screenRadius: 0,
    viewport: { width: 1280, height: 800, scale: 2 },
  },
}

const PAGE_BG = { light: '#ffffff', dark: '#141416' }
const PAGE_FG = { light: '#000000', dark: '#f2f2f7' }

function statusGlyphs(fg, scale) {
  return `<svg width="${78 * scale}" height="${14 * scale}" viewBox="0 0 78 14" fill="${fg}" aria-hidden="true">
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
  const scale = d.viewport.scale
  const S = (pt) => pt * scale
  const bg = PAGE_BG[scheme]
  const fg = PAGE_FG[scheme]
  const framePng = readFileSync(resolve(here, 'frames', d.file))
  const { width: fw, height: fh } = pngSize(framePng)
  const shot = pngSize(buffer)
  if (shot.width !== d.screen.w || shot.height !== d.screen.h) {
    throw new Error(
      `${kind}: capture is ${shot.width}x${shot.height} but the frame's screen is ` +
        `${d.screen.w}x${d.screen.h}. Fix DEVICES.${kind}.viewport rather than letting it rescale.`,
    )
  }

  // 状态栏里的时间要让开灵动岛：岛由机身贴图画在最上层，时间在它左边，图标在右边。
  const statusBar = d.statusBar
    ? `<div style="position:absolute;left:0;right:0;top:0;height:${S(d.statusBar)}px;background:${bg};
                   display:flex;align-items:center;justify-content:space-between;
                   padding:0 ${S(kind === 'phone' ? 30 : 26)}px;box-sizing:border-box">
         <span style="font:600 ${S(d.statusFont)}px/1 -apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;
                      color:${fg};letter-spacing:.2px">9:41</span>
         ${statusGlyphs(fg, scale)}
       </div>`
    : ''

  const homeBar = d.homeBar
    ? `<div style="position:absolute;left:50%;transform:translateX(-50%);bottom:${S(7)}px;
                   width:${S(d.homeBar)}px;height:${S(5)}px;border-radius:${S(2.5)}px;
                   background:${scheme === 'dark' ? 'rgba(255,255,255,.62)' : 'rgba(0,0,0,.55)'}"></div>`
    : ''

  const page = await (await browser.newContext({
    viewport: { width: fw, height: fh },
    deviceScaleFactor: 1,
  })).newPage()
  await page.setContent(`<!doctype html><body style="margin:0">
    <div style="position:relative;width:${fw}px;height:${fh}px">
      <div style="position:absolute;left:${d.screen.x}px;top:${d.screen.y}px;
                  width:${d.screen.w}px;height:${d.screen.h}px;overflow:hidden;
                  border-radius:${d.screenRadius}px;background:#000">
        <img src="data:image/png;base64,${buffer.toString('base64')}"
             width="${d.screen.w}" height="${d.screen.h}" style="display:block">
        ${statusBar}${homeBar}
      </div>
      <img src="data:image/png;base64,${framePng.toString('base64')}"
           width="${fw}" height="${fh}" style="position:absolute;left:0;top:0;display:block">
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

async function shoot({ browser, name, device, scheme, scrollTo, ball, sheet }) {
  const { width, height, scale } = DEVICES[device].viewport
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme: scheme,
    deviceScaleFactor: scale,
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
  console.log(`  ${name}.png  ${size.width}x${size.height}  (${device} ${width}x${height} @${scale}x ${scheme})`)
}

// Where createBall puts the ball on an iPhone 16 with a home indicator:
// x = 393 - 8 - 48, y = 852 - 34 - 8 - 48. See mountBall for why it is spelled out.
const BALL_DEFAULT = { x: 337, y: 762, edge: 'right' }
// A dragged position, for the shots where the sheet is open. Left at the
// default the ball ends up behind the sheet's bottom-right corner and only a
// sliver of its progress ring shows past the rounded edge — accurate, and it
// reads as a rendering seam. Dragging it is an equally real state: the ball is
// draggable and its position is remembered per site.
const BALL_DRAGGED = { x: 337, y: 150, edge: 'right' }

const browser = await chromium.launch()
console.log('Mac')
await shoot({ browser, device: 'mac', name: 'panel-light', scheme: 'light', scrollTo: 1100 })
await shoot({ browser, device: 'mac', name: 'panel-dark', scheme: 'dark', scrollTo: 1100 })
console.log('iPad')
// 1070 与 1020 不是随手挑的：home indicator 画在屏幕最下面 7pt 处，落在正文上就成了
// 一道穿字的黑杠。这两个偏移量是量出来的——把 indicator 那条带子对齐到段间空白。
await shoot({ browser, device: 'pad', name: 'ipad-panel-light', scheme: 'light', scrollTo: 1070 })
console.log('iPhone')
await shoot({ browser, device: 'phone', name: 'ball-light', scheme: 'light', scrollTo: 1020, ball: BALL_DEFAULT })
await shoot({ browser, device: 'phone', name: 'sheet-light', scheme: 'light', scrollTo: 1020, ball: BALL_DRAGGED, sheet: true })
await shoot({ browser, device: 'phone', name: 'sheet-dark', scheme: 'dark', scrollTo: 1020, ball: BALL_DRAGGED, sheet: true })
await browser.close()
