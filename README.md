# pagetoc-site

PageTOC 的产品站，Astro + Tailwind v4，部署在 GitHub Pages：
<https://szlab-ai.github.io/pagetoc-site/>

三个页面 × 两种语言（en / zh），对应 App Store Connect 需要的三个网址：

| App Store Connect 字段 | 页面 |
|---|---|
| 营销网址 | `/en/` |
| 支持网址 | `/en/support/` |
| 隐私政策网址 | `/en/privacy/` |

## 开发

```bash
npm install
npm run dev      # http://localhost:4321/pagetoc-site/
npm run build    # 输出到 dist/
```

推到 `main` 会触发 `.github/workflows/deploy.yml` 自动构建并发布。

## 截图是怎么来的

`public/screenshots/` 里的六张图不是重绘的示意图，屏幕里的一切都是**扩展自己的
渲染代码** @2x 实拍的产物。生成方式：

```bash
node scripts/capture.mjs
```

这个脚本从相邻的 `../SimpleTOC` 仓库导入构建好的扩展模块（`createToc`、
`createShadowHost`、`renderList`、`createBall`），在 `scripts/demo-article.html`
上挂载真实 UI 再截图。所以：

- 改了扩展的 UI，重跑一次脚本，站点截图就跟着更新；
- 演示文章是自己写的，**没有**使用仓库里保存的第三方站点快照 —— 那会把别人的
  内容和品牌发布到一个公开页面上。

**哪些是画的**：机身外壳、状态栏（9:41 与信号/Wi-Fi/电量图标）、灵动岛、Home
指示条、MacBook 底座 —— 这些是 mockup 元素，设备上没拍过。状态栏以下的一切都是真的。

**为什么用 Chromium 而不是 WebKit**：产品跑在 Safari 里，本来该用 WebKit，
一开始也是。但 Playwright 的 headless WebKit 对 `backdrop-filter` 谎报支持
（`CSS.supports` 返回 true，然后不做栅格化），而面板和抽屉是 94% 不透明、
全靠这层模糊的表面 —— WebKit 下正文会直接从目录里透出来。那是拍摄工具的问题，
不是设备上的样子。没有为截图改动任何产品 CSS。细节见 `scripts/capture.mjs` 顶部。

前置条件：`../SimpleTOC` 存在、已 `npm install`、已构建过扩展包。

## 内容的事实来源

文案不要凭印象改，都有出处，改之前先去对：

- 隐私政策：`SimpleTOC/design_handoff_pagetoc_v1/docs/privacy-policy.md`，
  且必须与 App 内 `PrivacyView.swift` 一致（那四条「从不存储」是规范来源）。
- 商店文案 / 功能列表：`SimpleTOC/design_handoff_pagetoc_v1/docs/store-listing.md`。
- 系统版本要求：`SimpleTOC/PageTOC/PageTOC.xcodeproj`（iOS 17.0 / macOS 14.0）。

## 上架当天要改的地方

App 还没上架，所以站点里**刻意没有任何 App Store 链接** —— 一个指向 404 的
下载按钮比没有按钮更糟。上架后要改两处：

1. `src/components/Hero.astro`：把「即将上架」的状态胶囊换成真正的 App Store 徽章。
2. `src/lib/schema.ts`：补上 `storeId`、`offers`、`downloadUrl`、`datePublished`。
   在那之前不要填 —— 编造的结构化数据会被判违规。
