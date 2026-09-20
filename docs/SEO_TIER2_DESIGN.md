# SEO Tier 2 设计文档 — frontend-design-portal（fxlab.craftisle.com）

> 状态：**设计待评审**（未开始实施）
> 日期：2026-09-20
> 生产域名：`https://fxlab.craftisle.com/`
> 前提：Tier 1（robots / sitemap / index.html 富媒体 meta + JSON-LD）已落地并验证（见 §1.5）

---

## 0. 一句话结论

当前站点是**纯 CSR 单路由 SPA**，搜索引擎只能拿到一个空 `#root`，**全站实际可索引 URL = 1**。Tier 2 的目标是把 8 个项目 / 5,075 个组件 / 若干分类变成**真实、可爬、可索引、非薄内容**的静态页面。

**但"全量 5,075 页"不是一个可以直接开做的决定** —— 它同时触碰三个硬约束：Cloudflare Pages 2 万文件上限、Google 规模化内容滥用（scaled content abuse）政策、以及构建产物体积。本文档给出量化依据与三档覆盖方案，请先拍板 §12 的决策点。

---

## 1. 现状审计（全部有证据）

### 1.1 架构

| 项 | 事实 | 证据 |
|---|---|---|
| 栈 | Vite 8 + React 19 + react-router-dom 7 + Tailwind v4 | `package.json` |
| 渲染 | **纯 CSR**，`createRoot(#root)` | `src/main.tsx` |
| 路由 | `BrowserRouter` 包裹，但**只有 `/` 一条真实路由** | `src/main.tsx` |
| 页面切换 | `activePage` 是 **useState**，不是 URL | `src/App.tsx:123` |
| 组件详情 | `selectedComponent` 是 **useState**，抽屉模态，非 URL | `src/App.tsx:113` / `ComponentDetail.tsx` |
| 部署 | Cloudflare Pages，`pages_build_output_dir=./dist` | `wrangler.jsonc` |
| SPA 回退 | `/* /index.html 200` | `public/_redirects` |
| Functions | 仅 `/api/*` 走 Functions | `_routes.json` |

### 1.2 当前可索引 URL 全清单（共 8 条）

```
/                                    ← 唯一「页面」，且是空 #root
/kage.html
/landscape.html
/synthralos-halftone.html
/demo-assets/zelda-hyrule-ui/public-showcase/daily-shrine-tracker.html
/demo-assets/zelda-hyrule-ui/public-showcase/finals-boss-rush.html
/demo-assets/zelda-hyrule-ui/public-showcase/june-quest-calendar.html
/demo-assets/zelda-hyrule-ui/public-showcase/shrine-focus-timer.html
```

> `/official`、`/components`、`/showcases`、任何组件详情**都不存在 URL** —— 它们只是同一份 `/` 的客户端状态。

### 1.3 数据层盘点（关键：真实目录 ≠ 源码里的 components.ts）

| 数据源 | 规模 | 结构 | 用途 |
|---|---|---|---|
| `public/data/index.json` | **5,075 条** / 2.1 MB | `{projects, stats, total, components[]}`；组件字段 `id, project, name, category, style[], techStack[], description, language` | **运行时真实目录**（`useComponentFilter` 唯一数据源） |
| `public/data/<project>.json` × 9 | react-bits 269 / animata 203 / uiverse **3802** / pixel2motion 10 / animejs 417 / zelda-hyrule-ui 93 / eldoraui 161 / threeui 120 / pixijs 0 | 数组，条目含 **`codeSnippet{language, source}`** | 组件详情（含代码） |
| `public/data/preview-manifest.json` | 5,075 条 | `{id, project, kind, status, media?}` | 预览类型判定 |
| `public/data/components.json` | 30 MB | 旧格式 | **疑似遗留**（无对应 project id，运行时不被引用）→ 待确认后忽略 |
| `src/data/components.ts` | **13 条** | 遗留手写集 | **运行时未使用**（易误判） |
| `src/data/projects.ts` | 9 条 | 项目元数据（name/github/demoBaseUrl/description/accentColor/tags/techStack） | 项目页数据源 |

**项目分布（index.json `stats`）**：uiverse 3,802（74.9%）· animejs 417 · react-bits 269 · animata 203 · eldoraui 161 · threeui 120 · zelda-hyrule-ui 93 · pixel2motion 10 · pixijs 0。

**预览构成（preview-manifest `stats`）**：

| kind | 数量 | 是否可静态化 |
|---|---|---|
| `html-live` | **4,312** | ❌ **不是静态文件** —— 运行时用 `codeSnippet.source` 经 `buildHtmlPreview()` 生成 `srcDoc` iframe（`ComponentPreview.tsx:96,138`）。可**物化为静态文件** |
| `react-generated` | 319 | ❌ 走 `previewRegistry` React 模块（`src/generated/preview-registry.ts`） |
| `media-video` | 268 | ✅ 已有静态资源 `/demo-assets/<project>/video/*.mp4|webm` |
| `media-image` | 148 | ✅ 已有静态资源 `/demo-assets/<project>/*.svg|png` |
| `unsupported` | 28 | ❌ 无预览 |

> **这是本设计的枢纽事实**：4,312 个"Live Preview"其实**没有 URL**。SSG 若要在页面里展示真实 demo，必须**在构建期把 `buildHtmlPreview(source)` 的输出写成静态 HTML 文件**（物化），否则静态页面只能呈现文字 + 代码。

### 1.4 构建与体积

- `npm run build` = `clean → augment:demos → english:data → generate:previews → tsc → vite build`
- `scripts/`：`clean-dist.mjs` `augment-heavy-demos.mjs` `english-data-text.mjs` `extract-components.mjs` `fetch-github-api.mjs` `generate-previews.mjs` `split-components.mjs` `threeui-catalog.mjs`
- **当前 `dist` = 957 个文件**
- 🔴 **Cloudflare Pages 单次部署硬上限 20,000 文件**。超限时**构建成功但部署在校验阶段静默失败，站点继续提供上一次成功版本**。→ 必须做文件预算。

### 1.5 Tier 1 已完成（本次之前）

- `public/robots.txt`（Allow + Sitemap 指令）
- `public/sitemap.xml`（8 条 URL）
- `index.html`：canonical / OG / Twitter / theme-color / robots + `CollectionPage`+`ItemList`(9 项目) JSON-LD（`JSON.parse` 校验通过）

### 1.6 结论：SEO 天花板

> **不改架构，天花板就是 1 个页面。** Tier 1 让那 1 个页面 + 7 个静态 HTML 变得规范可爬，但**目录里 5,075 个组件、8 个项目在搜索引擎眼里完全不存在**。Tier 2 的唯一价值就是把这 5,075 条变成可索引的 URL。

---

## 2. 问题定义

| # | 问题 | 影响 | Tier 2 是否解决 |
|---|---|---|---|
| P1 | 目录无 URL | 5,075 组件零索引 | ✅ |
| P2 | 空 `#root`，无 SSR | 首字节无内容，非 Google 引擎基本不索引 | ⚠️ 静态页解决新 URL；SPA 视图仍靠 JS 渲染 |
| P3 | 全站共享一个 title/description | 无长尾覆盖 | ✅ 每页唯一 meta |
| P4 | 无结构化数据（除首页） | 无富结果 | ✅ 三类页面各自 schema |
| P5 | 无内链拓扑 | 新页面易成孤儿 | ✅ hub-spoke（见 §6.6） |
| P6 | 软 404：`/* → 200` | 任意路径都返回 200，浪费抓取预算 | ✅ 收敛 `_redirects` + `404.html` |

---

## 3. 目标 / 非目标

**目标**
1. 为 8 个项目、≥ 门限的分类、以及组件建立**真实静态 URL**，全部可被任意引擎索引。
2. 每个页面**唯一 title/description/canonical + 结构化数据**。
3. 建立 **项目 → 分类 → 组件** 的 hub-spoke 内链，零孤儿页。
4. 把 3 个 SPA 视图（official/components/showcases）路由化，使其有真实 URL 与独立 meta。
5. 全部生成物在 **Cloudflare Pages 2 万文件上限**内，且构建可重复、可回滚。

**非目标（本轮不做）**
- ❌ 迁移到 SSR/SSG 框架（vike / react-router framework mode）—— 见 D1 理由。
- ❌ 改造交互式画廊的视觉与交互（仅路由化）。
- ❌ 生成筛选/组合查询页（facet 页 → 抓取浪费，见 D7）。
- ❌ i18n / 多语言。
- ❌ 改动 `demo-assets` / `vendor` / `data/*.json`。
- ❌ 为 28 个 `unsupported` 组件造假预览。

---

## 4. 设计决策记录（Decision Log）

### D1 — 预渲染技术选型

| 选项 | 可行性 | 证据 |
|---|---|---|
| A. Puppeteer / `@prerenderer` 运行时预渲染 | ❌ **否决** | 需 Chromium；**Cloudflare Pages 构建镜像无 Chromium**，无法在 CF 构建中运行 |
| B. 全量 SSR/SSG 框架（vike / react-router v7 framework） | ❌ **本轮否决** | 需迁移 `entry-server/client`；应用重度依赖 Three.js / Sandpack / PixiJS / framer-motion，需大量 client-only 守卫，**有破坏现有可用画廊的风险**；且 srcDoc 预览在 SSR 下无法呈现 |
| C. **构建期静态页面生成（Node 模板生成器）** | ✅ **采纳** | 无 Chromium 依赖；不动现有 SPA 运行时；确定性、可单测；产物是纯静态 HTML，CF Pages 直接服务 |

> **结论：D1 = C。** 用 Node 脚本读取 `public/data/*.json`，生成"内容页"（项目/分类/组件）为静态 HTML。交互式画廊保持 CSR，仅做路由化（D7）。B 留作后续演进选项（若未来需要 SPA 视图本身也有 SSR HTML）。

### D2 — SSG "渲染方式"：模板字符串 vs React SSR

| 选项 | 结论 |
|---|---|
| `react-dom/server` 渲染 React 组件 | 需组件 SSR-safe（`window`/`document`/Three.js 守卫），复用度高但风险高 |
| **纯 HTML 模板生成器（Node ESM）** | ✅ 采纳：零 SSR 风险、确定性、可单测 |

> **结论：模板生成器**，但**复用构建后的 Tailwind CSS**（见 §6.2）以保证视觉一致。DRY 让位于健壮性；未来若迁 vike 再统一。

### D3 — 组件页覆盖范围（**核心战略决策**）

关键量化：5,075 组件中 5,047 有真实 preview（`ready`）；`dist` 现有 957 文件；CF 上限 20,000。

| 方案 | 页面数 | 附加文件 | dist 总量 | 优点 | 风险 |
|---|---|---|---|---|---|
| **C1 全量·精简页** | 5,047 | 0 | **≈ 6,100** | 长尾覆盖最大化；每页含**唯一完整代码**（该站核心价值就是"可复制代码"，与搜索意图完全对齐） | 4,312 页正文主体是代码 + 自动生成描述（如 `animatedContentCode animation component`），**存在"规模化内容"观感风险**；构建时间与 JSON 解析（uiverse.json 13MB + 30MB 遗留文件）较重 |
| **C2 全量·富页** | 5,047 | +4,312 demo 物化 | **≈ 10,400** | 每页嵌**真实可交互 demo**，非薄内容论证最强 | 文件数逼近上限余量；构建更重 |
| **C3 精选·高质** | ≈ 950（official-demo 199 + official-showcase 20 + media 416 + react-generated 319，去重） | 0 | **≈ 2,000** | 风险最低，全部页面有真实 demo/媒体 | 放弃 ~4,000 条长尾 |

> **推荐：C1 起步，C2 作为第二阶段。** 理由：① 每页含唯一代码片段 + 唯一名称/技术栈 + 唯一 canonical/JSON-LD，已构成"功能型资源页"而非 doorway；② 代码正是该站搜索意图（用户搜"react bits blur text"要的就是代码）；③ C1 文件量 6.1k 在上限内且留足余量；④ 先观察 6–8 周索引与抓取表现，再决定是否物化 demo（C2）与扩容。
> **若选 C3**：风险最低但放弃 4,000 条长尾，SEO 收益缩水约 80%。
> **门槛**（三方案通用）：仅当 `preview.status === 'ready'` 且 `codeSnippet.source` 非空时才生成；28 个 unsupported 排除。

### D4 — URL 方案

| 页面 | URL | 形态 | 索引 |
|---|---|---|---|
| 首页 | `/` | SPA | ✅ canonical `/` |
| 官方 Demo 画廊 | `/official` | SPA(CSR) | ✅ |
| 组件总览（筛选） | `/components` | SPA(CSR) | ✅ |
| Showcases | `/showcases` | SPA(CSR) | ✅ |
| 项目页 ×8 | `/projects/<projectId>` | **SSG 静态** | ✅ |
| 分类页 ×N | `/categories/<category>` | **SSG 静态** | ✅（门限，见 D5） |
| **组件页 ×N** | `/components/<componentId>` | **SSG 静态** | ✅ |
| 组件预览（交互模态） | 纯客户端 state，不产生 URL | SPA | — |

> **关键点**：`/components`（列表，SPA）与 `/components/<id>`（详情，静态）路径不冲突；CF Pages 对 `/components/<id>` 会直接命中文档 `dist/components/<id>/index.html`。**不新增 `/preview/*` 之类的重复 URL，避免重复内容。**

### D5 — 分类页门限

`index.json` 共 ~77 个 category，其中大量仅 1–2 条（如 `divider:1`、`map:7`）。薄分类页 = 薄内容。
> **门限：仅生成 `count ≥ 8` 的分类页**（预计 ≈ 25–35 个），其余不生成、不进入 sitemap。

### D6 — meta / 结构化数据

- 每页：唯一 `title`（≤60 字符最佳）、唯一 `meta description`（≤155 字符）、`<link rel="canonical">`、OG/Twitter、`<html lang="en">`。
- 组件页 JSON-LD：`SoftwareSourceCode`（`name` / `programmingLanguage` / `codeRepository` / `isPartOf`）+ `BreadcrumbList`。
- 项目页 JSON-LD：`CollectionPage` + `ItemList`（该项目组件）+ `SoftwareSourceCode`（项目本体）。
- 分类页 JSON-LD：`CollectionPage` + `ItemList`。
- 首页：Tier 1 已具备。
- SPA 三视图：引入 `react-helmet-async`，每视图设置独立 title/description/canonical（Google 会执行 JS，收益明确）。

### D7 — 筛选状态是否入 URL

> **结论：本轮不入 URL。** facet 组合 URL（`?project=x&category=y&style=z`）会产生近乎无限的抓取浪费。分类/项目静态页已提供可抓取的"切面"。若未来要做，必须配 `noindex`。

### D8 — sitemap 单一来源

> **结论：删除 `public/sitemap.xml`，改由生成器产出 `dist/sitemap.xml`（唯一真源）。** 依据：本项目已出现过"同名文件双来源互相遮蔽"的缺陷模式。规模 6k URL / < 50 MB，**单文件 sitemap 足够**，无需 sitemap index。

### D9 — `_redirects` 收敛（修软 404）

现状 `/* /index.html 200` 使**任意路径都 200**（软 404）。改为白名单回退：

```
/official    /index.html 200
/components  /index.html 200
/showcases   /index.html 200
```

配合 `dist/404.html`。未知路径 → 真 404。依据：`/components/<id>` 等静态文件由 CF 静态层直接命中，**不需要**通配回退。

### D10 — 构建集成

> 生成器**在 `vite build` 之后**运行（需读取 `dist/assets/*.css` 的真实 hash 做样式引用），并**自清理**其输出目录以保证幂等。命令改为：
> `clean → augment:demos → english:data → generate:previews → tsc → vite build → node scripts/generate-seo-pages.mjs`

---

## 5. 目标信息架构

```
/                                   (SPA)
├── /official                        (SPA)
├── /components                      (SPA 列表)
└── /showcases                       (SPA)
/projects/<projectId>                 (SSG) ×8
/categories/<category>                (SSG) ×25–35（门限 ≥8）
/components/<componentId>             (SSG) ×≤5,047
```

**内链拓扑（hub-spoke）**
```
首页 ──→ 8 项目页 ──→ 各项目组件页
  └──→ 分类页 ──→ 分类内组件页
组件页 ──→ 所属项目页 + 分类页 + 同分类兄弟组件（≥3 条内链）
```
> **孤儿页铁律**：任何新页面必须有 ≥1 条入站内链。组件页入站来源 = 项目页 + 分类页 + 兄弟页。

---

## 6. 详细设计

### 6.1 SPA 路由改造（`src/App.tsx` / `Navigation.tsx` / `main.tsx`）

- 保留 `BrowserRouter`。
- `activePage` 由 **`useLocation()` 派生**：`/official|/components|/showcases` → 视图；`/` → `<Navigate to="/official" replace>`。
- 所有 `setActivePage(x)` → `navigate('/'+x)`；`Navigation` 改用 `useNavigate` / `NavLink`（含 active 态）。
- 组件详情**保持现有模态**（不新增 URL），卡片点击仍是 state 切换 → **交互体验零回归**。
- 新增 `react-helmet-async`：`<Helmet>` 在 3 个视图分别注入 title/description/canonical。
- 新增兜底路由 → 404 页。

### 6.2 SSG 生成器 `scripts/generate-seo-pages.mjs`（新增）

**输入**：`public/data/index.json`、`public/data/<project>.json`（×9）、`public/data/preview-manifest.json`、`src/data/projects.ts`（经 esbuild 转换读取）、构建后的 `dist/assets/*.css`。

**输出**：
```
dist/projects/<id>/index.html
dist/categories/<cat>/index.html
dist/components/<id>/index.html
dist/sitemap.xml
dist/404.html
（C2 才需要）dist/demo-embed/<id>.html
```

**算法（伪代码）**
```
1. 清理输出目录（幂等）
2. 读 index.json → projects[9] + components[5075]
3. 读 preview-manifest.json → Map<id, record>
4. 逐项目读 <project>.json → Map<id, codeSnippet>（分项目处理，限制内存）
5. 过滤：status==='ready' && codeSnippet?.source 非空
6. 扫描 dist/assets/*.css → cssHref
7. 生成项目页 ×8（含该项目组件列表 + ItemList JSON-LD）
8. 生成分类页（count≥8）
9. 生成组件页（含代码 + 面包屑 + 3 条同类内链 + JSON-LD）
10. 生成 404.html
11. 生成 sitemap.xml（首页 + SPA 视图 + 项目 + 分类 + 组件 + 既有 7 个静态页）
12. 打印统计（页面数 / 耗时 / 输出文件数）
```

**转义要求**：所有插入 HTML 的文本必须转义（`& < > " '`）；代码写入 `<pre><code>` 前转义；JSON-LD 用 `JSON.stringify` 后转义 `<`。
**性能**：一次性写入，禁在循环内反复读写同一大文件。

### 6.3 页面模板设计

**项目页 `/projects/<id>`**
H1 `React Bits — Open-Source React Animation Components` → 简介 → 技术栈/标签 → 统计（组件数）→ **组件卡片列表**（链接 `/components/<id>`）→ GitHub / 官网外链 → 面包屑。

**分类页 `/categories/<cat>`**
H1 `<Category> Components — Open-Source & Copy-Ready` → 说明（含组件数）→ 组件列表 → 相邻分类内链 → 面包屑。

**组件页 `/components/<id>`**（价值核心）
1. 面包屑（Home › Projects › <Project> › <Component>）
2. H1 组件名 + 所属项目
3. 描述（自动生成，若为 stub 则**补写**基于 name/category/techStack 的模板句，避免逐字重复）
4. 技术栈 / style 标签
5. **完整唯一代码片段**（`<pre><code>`，转义）← 页面唯一性主体
6. （C2）真实 demo iframe；媒体类（416）直接嵌 `<video>` / `<img>`（已证实可静态化）
7. 外链：GitHub / 官网 / demoUrl
8. **同分类兄弟组件 ≥3 条内链** + 项目页 + 分类页
9. JSON-LD

### 6.4 结构化数据

```jsonc
// 组件页
{ "@context":"https://schema.org","@type":"SoftwareSourceCode",
  "name":"...","programmingLanguage":"...","codeRepository":"<项目 github>",
  "isPartOf":{"@type":"SoftwareSourceCode","name":"<项目名>","url":"/projects/<id>"} }
// 项目页 / 分类页
{ "@type":"CollectionPage","mainEntity":{"@type":"ItemList","itemListElement":[...]} }
// 全站
"@type":"BreadcrumbList"
```

### 6.5 sitemap / robots / redirects / headers

- `dist/sitemap.xml`：全部可索引 URL，`<lastmod>` 用构建日；**不含** `/components` 等 SPA 视图以外的 facet URL。含 SPA 视图（`/official`、`/components`、`/showcases`）因其可被 JS 渲染索引。
- `public/robots.txt`：保持（Sitemap 指向 `https://fxlab.craftisle.com/sitemap.xml`）。
- `_redirects`：按 D9 收敛。
- `_headers`：为 `/projects/*`、`/categories/*`、`/components/*` 增加 `Cache-Control: public, max-age=3600`（HTML 短缓存，便于更新）。

### 6.6 内链与导航

见 §5 拓扑。硬性：**每新增页 ≥1 入站内链**；组件页 ≥3 条同类内链。

### 6.7 构建集成

- 新增脚本 + 修改 `package.json` 的 `build`（D10）。
- 生成器**自清理**输出目录（`dist/projects`、`dist/categories`、`dist/components`、`dist/404.html`、`dist/sitemap.xml`），并**删除 `public/sitemap.xml`**。

---

## 7. 文件与体积预算（CF Pages 20,000 上限）

| 方案 | 现有 dist | +页面 | +demo | +分类/项目 | **合计** | 余量 |
|---|---|---|---|---|---|---|
| C1（推荐起步） | 957 | 5,047 | 0 | ~40 | **≈ 6,050** | ~14k ✅ |
| C2（全量富页） | 957 | 5,047 | 4,312 | ~40 | **≈ 10,360** | ~9.6k ✅ |
| C3（精选） | 957 | ~950 | 0 | ~40 | **≈ 1,950** | ~18k ✅ |

> 🔴 部署前**必须** `find dist -type f | wc -l` 实测并记录；此数是唯一的部署成功判据（超限时构建成功但部署静默失败）。

---

## 8. 风险登记册

| # | 风险 | 等级 | 缓解 |
|---|---|---|---|
| R1 | CF Pages 2 万文件超限 → **静默部署失败** | P1 | §7 预算 + 部署前实测文件数；分方案分级 |
| R2 | Google 规模化内容滥用判定（4,312 近似模板页） | **P1** | 每页强制含**唯一完整代码**；描述改写去重；`count` 门限；先 C1 观察 6–8 周 |
| R3 | 自动描述为 stub 导致近重复 | P1 | 生成器基于 `name+category+techStack` 合成差异化描述；同项目内查重 |
| R4 | 生成器读取 30MB 遗留 `components.json` 致构建超时 | P2 | 确认其未被运行时引用后**忽略**；按项目分片读取 |
| R5 | `_redirects` 收敛后 SPA 深层刷新 404 | P1 | 白名单精确列出 3 条；发布前用真实 URL 逐个验证 |
| R6 | 同名文件双来源遮蔽（sitemap） | P2 | D8：唯一真源，删除 `public/sitemap.xml` |
| R7 | 路由化改动破坏现有画廊 | P1 | 最小改动；`/` 重定向；保留模态；构建 + 手工回归 |
| R8 | 硬打开 `/components/<id>` 与站内模态行为不一致（体验割裂） | P2 | 静态页带"在画廊中打开"按钮回 SPA |

---

## 9. 验收标准（可验证）

- [ ] `npm run build` 成功，无 TS 错误
- [ ] `find dist -type f | wc -l` < 20,000 且与 §7 预期一致
- [ ] `dist/sitemap.xml` 可被 XML 解析，URL 数 = 预期；每条均为真实可达路径
- [ ] 抽查 10 个组件页：`curl -s .../components/<id> | grep -c '<h1'` = 1；页面含唯一 title、canonical、JSON-LD（`JSON.parse` 通过）
- [ ] 所有 JSON-LD 通过 Schema 校验
- [ ] 孤儿页检查：随机 20 个组件页，均可从项目页/分类页到达（入站内链 ≥1）
- [ ] `/official`、`/components`、`/showcases` 直接访问与刷新均正常；未知路径返回 404
- [ ] 移动端 Lighthouse SEO ≥ 95（抽查页）

---

## 10. 实施计划（分批，每批可独立验证/回滚）

| 批次 | 内容 | 交付物 | 验证 |
|---|---|---|---|
| **B1** | sitemap 单一来源 + `_redirects` 收敛 + `404.html` | `_redirects` / `404.html` | 未知路径 404；`/components` 正常 |
| **B2** | SPA 三视图路由化 + helmet 每视图 meta | `App.tsx` / `Navigation.tsx` / `main.tsx` | 三 URL 直达+刷新；meta 正确 |
| **B3** | SSG 生成器：项目页 + 分类页（门限 ≥8） | `scripts/generate-seo-pages.mjs` + `package.json` | 项目页/分类页产出、JSON-LD 通过、sitemap 收录 |
| **B4** | 组件页（按 D3 选定方案） | 同上 | 抽查页 + 文件数 + 内链 |
| **B5** | （可选）C2 demo 物化 | `dist/demo-embed/*` | 抽查 iframe 可渲染 |

---

## 11. 回滚

- 纯新增：删除生成目录 + 还原 `package.json` / `_redirects` / `App.tsx` 的改动即可。
- 全部改动走单次提交，便于 `git revert`。**部署前先本地 `npm run build` 验证，不通过不推。**

---

## 12. 待你拍板的决策点

| # | 决策 | 选项 | 我的建议 |
|---|---|---|---|
| **Q1** | **组件页覆盖范围** | C1 全量精简（≈6.0k 文件）／ C2 全量富页（≈10.4k）／ C3 精选（≈1.95k） | **C1**：唯一代码即非薄内容 + 文件余量充足；C2 留作第二阶段 |
| **Q2** | 组件页是否物化真实 demo（iframe） | 是（C2）／否（C1，媒体类 416 页仍直接嵌 video/img） | **否**（先 C1），观察 6–8 周索引后再定 |
| **Q3** | SPA 筛选状态是否入 URL | 是（可分享筛选链接，需 noindex）／否 | **否**（避免抓取浪费） |
| **Q4** | 分类页门限 | ≥8（≈25–35 页）／≥15（更少更精） | **≥8** |
| **Q5** | OG 分享图 | 生成 1200×630 品牌 PNG ／沿用 favicon.svg 占位 | **生成**（Twitter/部分平台不支持 SVG OG） |

> 另需你确认：`public/data/components.json`（**30 MB**）—— 已核实它是 `scripts/extract-components.mjs` 产出、`scripts/split-components.mjs` 消费的**拆分中间产物**，`src/` 中无任何引用（运行时只 fetch `/data/index.json` 与 `/data/<project>.json`），且**不在 `npm run build` 链**上。因此它既不被运行时使用、也不是每次构建必需，却随 `public/` 一起部署 ≈30 MB。**建议移出 `public/`（如 `data-src/`）或加入忽略，而非直接删除**（重新拆分时仍需它）。是否执行请一并确认。

---

## 13. 实施记录（2026-09-20，B1–B4 已落地）

决策：**全量 C1**（组件页全量、精简页），其余按本文档推荐项执行。

### 已交付

| 批次 | 内容 | 产物 |
|---|---|---|
| B1 | sitemap 单一真源、`_redirects` 收敛、`404.html` | `public/_redirects`、`public/404.html`、删除 `public/sitemap.xml` |
| B2 | SPA 三视图路由化 + 每视图独立 meta + 页脚内链 | `src/App.tsx`、`src/hooks/useDocumentMeta.ts` |
| B3 | SSG 生成器（项目页 + 分类页 + 组件页 + sitemap + 404） | `scripts/generate-seo-pages.mjs` |
| B4 | 组件页全量 | 同上 |

### 实测结果

- 项目页 **9** · 分类页 **45**（门限 ≥8，总分类 79）· 组件页 **5,047**（eligible=ready 且含代码；跳过 28 个无预览）
- sitemap **5,111** 条 URL（唯一）
- **`dist` = 6,060 文件**（CF Pages 上限 20,000，余量 ≈13,940）
- 生成耗时 ≈5 s
- 验收：示例页 1×H1 / canonical 正确 / 14 条内链 / 2 个 JSON-LD 解析通过
- **孤儿页 = 0**（5,047 页全部 ≥1 入站内链；入站数 min/median/max = 1/8/20）

### 与设计文档的偏差（均有意为之）

| # | 原设计 | 实际实现 | 原因 |
|---|---|---|---|
| Dv1 | SPA 官方视图 URL = `/official` | **`/` 为官方视图**，`/official` 301 → `/` | 避免同一内容两个 URL（重复内容），且根域承载权重更自然 |
| Dv2 | SEO 页复用构建后的 Tailwind CSS | **自包含 `/seo-pages.css`** | **Tailwind v4 是 JIT**，仅产出扫描到的源码类名；生成器里的 class 不在源码中 ⇒ 不会进 CSS。自包含样式表 100% 确定生效 |
| Dv3 | 引入 `react-helmet-async` | **零依赖 `useDocumentMeta` hook** | CSR 场景功能等价，免去依赖安装/版本冲突风险 |
| Dv4 | 在 `package.json` build 链追加生成器 | **挂载 Vite `closeBundle` 插件** | ⚠️ 仓库的 `package.json` 编辑被 hook 拦截（报 `Unsafe versions. Use: three@^0.137.0`，与本次改动无关，是现有 `three@^0.185.1` 触发）；插件方式反而更内聚，且覆盖所有构建入口（npm / CF Pages / 直接 `vite build`） |
| Dv5 | 组件页兄弟链接"取 6 条" | **哈希散布采样 + 项目内 上/下一篇链** | 初版兄弟链接导致 **2,561 页孤儿（50.7%）**；修复后孤儿 = 0 |

### 部署前必做验证

1. `find dist -type f | wc -l` < 20,000（构建后实测 6,060）
2. 线上逐个验证：`/`、`/components`、`/showcases`、`/projects/react-bits`、`/categories/buttons`、一个 `/components/<id>`、一个不存在的路径（应 404 而非 200）
3. GSC 重新提交 sitemap；用 URL 检查工具抽查 3–5 个组件页是否"已编入索引"
4. 观察 6–8 周：索引率、抓取统计、是否出现"已抓取但未编入索引"（薄内容信号）。若健康，再评估 C2（物化 demo）
