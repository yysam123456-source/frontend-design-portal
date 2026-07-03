# 全量真实预览系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将组件门户从手写 POC 预览升级为构建期生成、运行时按需加载的全量真实预览系统。

**Architecture:** HTML/JS 组件继续 iframe 实时渲染；React/TSX 组件通过构建期生成 preview manifest 和 registry，由前端统一按需加载。不能自动渲染的组件进入 manifest 失败队列，保留原因和源码兜底，不再出现 Sandpack 超时或空白预览。

**Tech Stack:** Vite、React、TypeScript、Tailwind CSS、Node.js 生成脚本、动态 import、ErrorBoundary。

---

## 文件结构

- Create: `scripts/generate-previews.mjs`：扫描数据和源码，生成 manifest、registry、静态预览元数据。
- Create: `src/generated/preview-manifest.json`：运行时使用的预览状态清单。
- Create: `src/generated/preview-registry.ts`：动态 import 注册表，先接入已验证本地预览。
- Create: `src/generated/GeneratedComponentPreview.tsx`：统一 React 真实预览渲染器。
- Create: `src/generated/PreviewBoundary.tsx`：单组件错误边界。
- Modify: `src/components/ComponentPreview.tsx`：改为 manifest/registry 优先。
- Modify: `src/components/ComponentThumbnailPreview.tsx`：首页缩略图接入 manifest/registry。
- Modify: `package.json`：增加 `generate:previews` 并让 build 前自动生成。

## Task 1: 生成系统骨架

- [ ] 创建 `scripts/generate-previews.mjs`，输出 manifest 和 registry。
- [ ] 生成内容覆盖：HTML/JS 项目标记为 live，可本地预览的 5 个 Animata 组件标记为 generated，其余 React 组件标记为 unsupported。
- [ ] 运行 `node scripts/generate-previews.mjs`，确认生成文件存在。
- [ ] 运行 `npm run build`，确认构建通过。

## Task 2: 运行时统一渲染器

- [ ] 创建 `src/generated/PreviewBoundary.tsx`，避免单个 preview 报错拖垮页面。
- [ ] 创建 `src/generated/GeneratedComponentPreview.tsx`，统一加载 registry 中的预览组件。
- [ ] 将现有 `LocalComponentPreview` 作为 POC registry 的首批入口。
- [ ] 运行 `npm run build`，确认类型和打包通过。

## Task 3: 详情页接入

- [ ] 修改 `ComponentPreview.tsx`，查询 manifest 后决定预览方式。
- [ ] generated 组件默认显示实时预览。
- [ ] html-live/js-demo 继续 iframe。
- [ ] unsupported 默认源码，并显示“暂未自动适配真实预览”的原因。
- [ ] 浏览器验证 `Faq`、`Spinner`、`Typing Text`、`uiverse` HTML 组件。

## Task 4: 首页卡片接入

- [ ] 修改 `ComponentThumbnailPreview.tsx`，generated 组件显示 compact 真实预览。
- [ ] html-live 继续 iframe 缩略图。
- [ ] unsupported 保持视觉 fallback，不能显示 Sandpack 或空白。
- [ ] 浏览器验证 `Faq`、`Spinner`、`Typing Text` 首页卡片。

## Task 5: 构建链路接入

- [ ] 修改 `package.json`，新增 `generate:previews`。
- [ ] 修改 build 为 `npm run generate:previews && tsc && vite build`。
- [ ] 运行完整 build。
- [ ] 重启 preview 服务，确认页面可访问。

## Task 6: 后续扩展入口

- [ ] 在 `generate-previews.mjs` 内留下项目生成器接口。
- [ ] 输出统计：ready/html-live/js-demo/unsupported 数量。
- [ ] 下一轮扩展时先做 Animata 自动 story 解析，不再继续手写 if-else。

