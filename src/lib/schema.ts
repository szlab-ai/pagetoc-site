import type { Lang } from '../i18n/ui';

/**
 * 结构化数据里的产品事实。每一条都能在 SimpleTOC 仓库里对上：
 * 部署目标来自 PageTOC.xcodeproj（IPHONEOS 17.0 / MACOSX 14.0），
 * 名称、类别、分级、免费与否来自 design_handoff_pagetoc_v1/docs/store-listing.md。
 *
 * 刻意没有 `offers` / `downloadUrl` / `aggregateRating`：PageTOC 还没有上架，
 * 填一个不存在的 App Store 链接或评分是编造的结构化数据，会被判违规 ——
 * 上架当天再补 storeId、offers 和 datePublished。
 */
export const APP = {
  name: 'PageTOC',
  version: '1.0',
  operatingSystem: 'iOS 17.0 or later, iPadOS 17.0 or later, macOS 14.0 or later',
  contentRating: '4+',
  publisherName: 'SZLab',
  email: 'szlab.ai@outlook.com',
} as const;

const SHOTS = ['panel-light', 'panel-dark', 'sheet-light', 'sheet-dark', 'ball-light'];

const copy = {
  en: {
    siteName: 'PageTOC',
    appDescription:
      'PageTOC is a Safari extension for iPhone, iPad and Mac that builds a navigable table of contents from a web page’s own heading structure, highlights the section you are reading, and scrolls smoothly to any heading. It collects no data and makes no network requests.',
    features: [
      'Builds an outline from the page’s own heading tags — no per-site configuration',
      'Highlights the section you are currently reading, with a reading-progress bar',
      'Smooth scrolling to any heading, including inside a page’s own scroll container',
      'A draggable floating button on iPhone and iPad that snaps to the edge, remembered per site',
      'A draggable panel on Mac, shown and hidden with ⌘⇧E',
      'Follows Dark Mode',
      'Hide it on a site in one tap, and manage the list in the app',
      'Collects no data: no account, no analytics, no server, and no networking code at all',
    ],
    breadcrumbHome: 'Home',
    pageNames: { privacy: 'Privacy Policy', support: 'Support' },
  },
  zh: {
    siteName: 'PageTOC',
    appDescription:
      'PageTOC 是一个适用于 iPhone、iPad 与 Mac 的 Safari 扩展：按网页自身的标题层级生成可跳转的目录，高亮你正在阅读的章节，并平滑滚动到任意标题。它不收集任何数据，也不发起任何网络请求。',
    features: [
      '按页面真实的标题标签生成目录，不需要为任何站点做配置',
      '高亮当前所在章节，并显示阅读进度',
      '平滑滚动到任意标题，支持页面自身的滚动容器',
      'iPhone 与 iPad 上是可拖动的悬浮球，松手吸边，按站点记住位置',
      'Mac 上是可拖动的面板，⌘⇧E 显示或隐藏',
      '跟随深色模式',
      '一次点按即可在某个站点隐藏，名单在 App 里管理',
      '不收集任何数据：没有账号、没有统计、没有服务器，也没有任何网络代码',
    ],
    breadcrumbHome: '首页',
    pageNames: { privacy: '隐私政策', support: '支持' },
  },
} as const;

type PageKind = 'home' | 'privacy' | 'support';

export interface SchemaInput {
  lang: Lang;
  page: PageKind;
  /** 站点根，如 https://szlab-ai.github.io */
  site: URL | string;
  /** BASE_URL，如 /pagetoc-site/ */
  base: string;
  /** 当前页 canonical */
  canonical: string;
  title: string;
  description: string;
  /** 页面上可见的 FAQ 问答对；给了就生成 FAQPage */
  faq?: ReadonlyArray<{ q: string; a: string }>;
}

export function buildSchema(input: SchemaInput) {
  const { lang, page, site, base, canonical, title, description, faq } = input;
  const abs = (p: string) => new URL(`${base}${p}`, site).href;
  const home = abs(`${lang}/`);
  const c = copy[lang];
  const inLanguage = lang === 'zh' ? 'zh-Hans' : 'en';

  const orgId = `${abs('')}#organization`;
  const siteId = `${abs('')}#website`;
  const appId = `${abs('')}#app`;

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': orgId,
      name: APP.publisherName,
      url: home,
      email: APP.email,
      logo: { '@type': 'ImageObject', url: abs('brand/pagetoc.png'), width: 256, height: 256 },
    },
    {
      '@type': 'WebSite',
      '@id': siteId,
      url: home,
      name: c.siteName,
      description,
      inLanguage,
      publisher: { '@id': orgId },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': appId,
      name: APP.name,
      description: c.appDescription,
      url: home,
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'BrowserApplication',
      operatingSystem: APP.operatingSystem,
      softwareVersion: APP.version,
      contentRating: APP.contentRating,
      inLanguage: ['en', 'zh-Hans'],
      image: abs('brand/pagetoc.png'),
      screenshot: SHOTS.map((s) => abs(`screenshots/${s}.png`)),
      featureList: c.features,
      isAccessibleForFree: true,
      publisher: { '@id': orgId },
    },
  ];

  if (page === 'home') {
    graph.push({
      '@type': 'WebPage',
      '@id': canonical,
      url: canonical,
      name: title,
      description,
      inLanguage,
      isPartOf: { '@id': siteId },
      about: { '@id': appId },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: abs('screenshots/panel-light.png'),
        width: 2560,
        height: 1600,
      },
    });
  } else {
    graph.push({
      '@type': 'WebPage',
      '@id': canonical,
      url: canonical,
      name: title,
      description,
      inLanguage,
      isPartOf: { '@id': siteId },
      about: { '@id': appId },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.breadcrumbHome, item: home },
          { '@type': 'ListItem', position: 2, name: c.pageNames[page] },
        ],
      },
    });
  }

  if (faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      inLanguage,
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
