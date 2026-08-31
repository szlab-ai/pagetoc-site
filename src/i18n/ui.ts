export const defaultLang = 'en' as const;

/**
 * 站点全部可见文案。英文与中文一一对应 —— `ui.zh` 缺 key 时 `useTranslations`
 * 会回落到英文，所以少写一条不会报错，只会静默出现半英文页面。加 key 时两边一起加。
 *
 * 事实来源是 SimpleTOC 仓库的 design_handoff_pagetoc_v1/docs/store-listing.md 与
 * privacy-policy.md。隐私相关的措辞与 App 内 PrivacyView.swift 必须一致，
 * 那四条 "never stored" 是规范来源，改这里之前先确认那边。
 */
export const ui = {
  en: {
    'nav.features': 'Features',
    'nav.how': 'How it works',
    'nav.privacy': 'Privacy',
    'nav.support': 'Support',

    'hero.tagline': 'A table of contents for any long page in Safari.',
    'hero.subtitle': 'PageTOC reads a page’s own headings and builds an outline you can jump around in — on iPhone, iPad and Mac.',
    'hero.status': 'Coming to the App Store',
    'hero.platforms': 'Safari on iOS 17+, iPadOS 17+ and macOS 14+',

    'shots.heading': 'What it looks like',
    'shots.panel': 'A draggable panel on Mac. ⌘⇧E shows and hides it.',
    'shots.ball': 'On iPhone it is a floating button — drag it anywhere, it snaps to the edge.',
    'shots.sheet': 'Tap it and the outline slides up, with the section you are reading highlighted.',
    'shots.panelDark': 'Light and dark, matched to Safari.',
    'shots.ipad': 'On iPad the panel sits in the margin next to the article, and stays wherever you drag it.',
    'shots.alt.panel': 'A long article in Safari on Mac with the PageTOC panel open beside it, the current section highlighted',
    'shots.alt.panelDark': 'The same panel in dark mode',
    'shots.alt.ipad': 'A long article on iPad with the PageTOC panel docked in the right margin, the current section highlighted',
    'shots.alt.ball': 'An article on iPhone with the PageTOC floating button resting against the right edge',
    'shots.alt.sheet': 'The PageTOC sheet open over an article on iPhone, showing a nested outline with a progress bar',
    'shots.alt.sheetDark': 'The same sheet in dark mode',

    'features.heading': 'What it does',
    'feat.outline.title': 'Built from the page itself',
    'feat.outline.desc': 'The outline comes from the page’s real heading tags. Nothing to configure, per site or otherwise.',
    'feat.here.title': 'Always shows where you are',
    'feat.here.desc': 'The section you are reading stays highlighted as you scroll, with a bar for how far into the page you have got.',
    'feat.jump.title': 'One tap to anywhere',
    'feat.jump.desc': 'Smooth scrolling to any heading — including headings inside a page’s own scrolling container.',
    'feat.ball.title': 'A button you place yourself',
    'feat.ball.desc': 'Drag the floating button wherever it suits you. It snaps to the edge and stays there, remembered per site.',
    'feat.dark.title': 'Follows Dark Mode',
    'feat.dark.desc': 'Light and dark, matched to Safari, on all three platforms.',
    'feat.block.title': 'Not on every site',
    'feat.block.desc': 'Hide PageTOC on a site in one tap. The list of hidden sites lives in the app, and you can undo it there.',

    'how.heading': 'Three steps, once',
    'how.1.title': 'Install and open the app',
    'how.1.desc': 'The app is small on purpose: an enable card, two settings, and the list of sites you have hidden it on.',
    'how.2.title': 'Turn PageTOC on in Safari',
    'how.2.desc': 'Safari asks for permission per site the first time you use it there. Choosing “Always Allow” means it stops asking.',
    'how.3.title': 'Open any long page',
    'how.3.desc': 'Tap the floating button on iPhone or iPad, or press ⌘⇧E on Mac.',

    'privacy.heading': 'It collects nothing',
    'privacy.lede': 'No account, no analytics, no crash reporting, no server. The extension contains no networking code at all — no fetch, no XMLHttpRequest, no WebSocket, no sendBeacon — so there is nothing to opt out of.',
    'privacy.storedTitle': 'Stored on your device',
    'privacy.stored': 'Your two settings; the sites you chose to hide it on; where you dragged the panel or the button, per site.',
    'privacy.neverTitle': 'Never stored',
    'privacy.never': 'The addresses of pages you visit; how far you have read; any content from the pages; any identifier for you or your device.',
    'privacy.verify': 'You do not have to take our word for it: run PageTOC behind an HTTP proxy and watch it produce no traffic at all.',
    'privacy.link': 'Read the full privacy policy',

    'limits.heading': 'What it cannot do',
    'limits.reader': 'Safari does not let extensions run in Reader view or on native PDFs, so PageTOC cannot add an outline in either place.',
    'limits.headings': 'Pages that style ordinary text to look like headings, instead of using real heading tags, may come up empty.',
    'limits.tell': 'If that happens on a page you care about, send us the address — with no analytics, it is the only way we find out.',

    'footer.copyright': '© 2026 SZLab',
    'footer.privacy': 'Privacy Policy',
    'footer.support': 'Support',
    'footer.contact': 'Contact',
    'footer.appleCredit': 'Apple, the Apple logo, Safari, iPhone, iPad, Mac and App Store are trademarks of Apple Inc., registered in the U.S. and other countries and regions.',
  },
  zh: {
    'nav.features': '功能',
    'nav.how': '怎么用',
    'nav.privacy': '隐私',
    'nav.support': '支持',

    'hero.tagline': '给 Safari 里的长网页，补上一份目录。',
    'hero.subtitle': 'PageTOC 读取页面自身的标题层级，生成可以随意跳转的目录 —— iPhone、iPad、Mac 都能用。',
    'hero.status': '即将上架 App Store',
    'hero.platforms': '适用于 iOS 17+、iPadOS 17+ 与 macOS 14+ 的 Safari',

    'shots.heading': '它长什么样',
    'shots.panel': 'Mac 上是可拖动的面板，⌘⇧E 显示或隐藏。',
    'shots.ball': 'iPhone 上是一个悬浮球 —— 拖到哪都行，松手吸到边缘。',
    'shots.sheet': '点一下，目录从下方升起，你正在读的那一节是高亮的。',
    'shots.panelDark': '明暗两套外观，跟着 Safari 走。',
    'shots.ipad': 'iPad 上面板就停在正文旁边的页边，拖到哪就留在哪。',
    'shots.alt.panel': 'Mac 版 Safari 中的长文，旁边打开着 PageTOC 面板，当前章节高亮',
    'shots.alt.panelDark': '同一个面板的深色模式',
    'shots.alt.ipad': 'iPad 上的长文，PageTOC 面板停在右侧页边，当前章节高亮',
    'shots.alt.ball': 'iPhone 上的一篇文章，PageTOC 悬浮球吸附在右边缘',
    'shots.alt.sheet': 'iPhone 上打开的 PageTOC 抽屉，显示带层级的目录和进度条',
    'shots.alt.sheetDark': '同一个抽屉的深色模式',

    'features.heading': '它能做什么',
    'feat.outline.title': '目录来自页面本身',
    'feat.outline.desc': '按页面真实的标题标签生成，不需要为任何站点做配置。',
    'feat.here.title': '始终标出你在哪',
    'feat.here.desc': '滚动时当前章节持续高亮，另有一条进度显示你读到了页面的什么位置。',
    'feat.jump.title': '一次点按跳到任意位置',
    'feat.jump.desc': '平滑滚动到任何标题 —— 包括位于页面自身滚动容器里的标题。',
    'feat.ball.title': '悬浮球放在你想放的地方',
    'feat.ball.desc': '拖到顺手的位置，松手吸到边缘并留在那里，按站点分别记住。',
    'feat.dark.title': '跟随深色模式',
    'feat.dark.desc': '三个平台上都与 Safari 的明暗外观一致。',
    'feat.block.title': '不必出现在每个站点',
    'feat.block.desc': '一次点按即可在某个站点隐藏它。被隐藏的站点在 App 里成列，随时可以撤销。',

    'how.heading': '三步，只做一次',
    'how.1.title': '安装并打开 App',
    'how.1.desc': 'App 是刻意做小的：一张启用卡片、两个设置项，以及你隐藏过它的站点列表。',
    'how.2.title': '在 Safari 里打开 PageTOC',
    'how.2.desc': '第一次在某个站点使用时 Safari 会询问权限，选「始终允许」之后就不再问。',
    'how.3.title': '打开任意一个长页面',
    'how.3.desc': 'iPhone 和 iPad 上点悬浮球，Mac 上按 ⌘⇧E。',

    'privacy.heading': '它什么都不收集',
    'privacy.lede': '没有账号、没有统计、没有崩溃上报、没有服务器。扩展里根本没有任何网络代码 —— 没有 fetch、没有 XMLHttpRequest、没有 WebSocket、没有 sendBeacon —— 所以也没有什么需要你去关闭。',
    'privacy.storedTitle': '存在你设备上的',
    'privacy.stored': '你的两项设置；你选择隐藏它的站点；你把面板或悬浮球拖到的位置，按站点记住。',
    'privacy.neverTitle': '从不存储的',
    'privacy.never': '你访问过的页面网址；你读到了哪里；页面中的任何内容；任何标识你或你设备的信息。',
    'privacy.verify': '这话不用你信：把 PageTOC 挂在 HTTP 代理后面跑一遍，你会看到它完全不产生任何流量。',
    'privacy.link': '阅读完整隐私政策',

    'limits.heading': '它做不到的事',
    'limits.reader': 'Safari 不允许扩展在阅读器视图和原生 PDF 中运行，这两处无法生成目录。',
    'limits.headings': '用样式把普通文字装成标题、而没有使用真实标题标签的页面，可能识别为空。',
    'limits.tell': '如果这发生在你在意的页面上，把网址发给我们 —— 没有统计，这是我们唯一能知道的途径。',

    'footer.copyright': '© 2026 SZLab',
    'footer.privacy': '隐私政策',
    'footer.support': '支持',
    'footer.contact': '联系',
    'footer.appleCredit': 'Apple、Apple 标志、Safari、iPhone、iPad、Mac 和 App Store 是 Apple Inc. 在美国及其他国家和地区注册的商标。',
  },
} as const;

export type Lang = keyof typeof ui;
