# Chapter 12 多模型对比任务：屏幕空间反射诊断实验

## 基线与目标

- 基线分支：`codex/benchmark-chapter-12-ssr`
- 工作页面：`chapters/chapter-12.html`
- 现有 Bloom 实验必须保持可用。
- 新增实验 ID：`screen-space-reflections`
- 本文件和 `scripts/grade-chapter-12-ssr.mjs` 是固定评测材料，参赛实现不得修改。

## 给开发 Agent 的 Prompt

你正在扩展一个用于讲解《Real-Time Rendering 4th》的静态 WebGL 教学网站。请在 Chapter 12 页面新增“屏幕空间反射诊断”实验，让学习者能够观察 SSR 从 G-buffer、视空间反射光线步进、命中置信度到最终合成的全过程，并明确看到离开屏幕、深度不连续和粗糙表面造成的失效。

请先阅读仓库中的 `.codex/skills/rtr4-web-lab-frontend/SKILL.md`、现有 Chapter 12 Bloom 实验以及 `src/render/` 公共模块，然后完成实现。不得引入框架、构建步骤、外部 CDN 或运行时依赖，生产结果仍须是浏览器直接加载的静态 HTML/CSS/ES modules。

必须完成以下内容：

1. 在 `src/app/lab-registry.js` 注册 `screen-space-reflections`，链接到 `./chapters/chapter-12.html#screen-space-reflections`，渲染后端标为 `webgl2`。
2. 在 Chapter 12 的 Bloom 实验之后新增独立实验区。提供 `ssrCanvas`，以及视图选择 `ssrView`；视图值至少包含 `composite`、`reflection`、`confidence`、`depth`、`normal`。
3. 提供可实时交互的 `ssrMaxSteps`、`ssrStepSize`、`ssrThickness`、`ssrRoughness` 四个控制项，每项都有绑定的 `output`。参数变化必须改变实际算法或采样结果，不能只改标签或整体透明度。
4. 使用 WebGL2 离屏目标生成场景颜色和法线/深度信息，再在屏幕空间中沿反射方向步进。深度比较必须在一致坐标空间中完成；越出屏幕、未命中和深度不连续需要被拒绝。命中后至少做一次区间细化或等效的亚步长改进。
5. 场景至少包含两个有清晰空间关系的物体和一个反射表面，使屏幕内命中、屏幕外缺失、边缘衰减和粗糙度变化都能肉眼辨认。禁止用预绘反射、简单翻转画面或与 G-buffer 无关的程序贴图冒充 SSR。
6. 显示 `ssrHitRate`、`ssrAverageSteps`、`ssrResolution` 三项指标。命中率和平均步数必须来自当前渲染结果的 GPU 数据或低分辨率诊断缓冲，不得写死；如使用 `readPixels`，读取频率不得高于每秒 4 次。
7. 新模块放在 `src/labs/chapter-12/screen-space-reflections.js`，导出并由 Chapter 12 页面入口调用 `initScreenSpaceReflectionsLab`。复用 `src/render/` 公共能力，正确处理画布 resize、DPR、WebGL 状态和资源尺寸。
8. 缺少 WebGL2 或所需扩展时，在新实验区显示可读错误，不得影响 Bloom 实验。Canvas 必须有可访问名称，手机宽度下不得产生页面级横向滚动。
9. 更新缓存版本与 `scripts/check-ui.mjs`，为新增实验加入路由选择器、非空画布、视图差异、控件响应和移动端溢出检查。保持现有检查全部通过。

完成后执行：

```bash
npm run check:js
npm run check:chapters
npm run check:translations
git diff --check
python3 -m http.server 4173
npm run grade:ssr -- http://127.0.0.1:4173
npm run check:ui -- http://127.0.0.1:4173
```

请提交实现、简短说明采用的 G-buffer 编码与命中判定方法，并报告实际执行过的检查。不要部署，不要修改固定评测材料。

## 核心难点（trap）

SSR 的光线、采样深度和重建位置必须处于同一坐标空间；直接拿非线性深度与视空间距离比较，会产生看似合理但随视角漂移的错误命中。反射射线越出屏幕应当判为缺失，不能用 clamp 或 repeat 把边缘像素伪装成命中，屏幕外物体本来就无法被 SSR 看到。用 `readPixels` 每帧统计指标会强制 CPU/GPU 同步，而写死命中率又失去诊断意义，因此需要低频、低分辨率的真实统计。画布尺寸、DPR 和多个 FBO 必须同步更新，同时不能泄漏 WebGL 状态破坏同页已有 Bloom 实验。

## Rubric（每项 10 分）

1. 注册表、章节导航和页面入口均能到达 `screen-space-reflections`，且原 Bloom 实验仍可用。
2. 五种诊断视图均存在并产生可辨认、彼此不同的真实缓冲结果。
3. 实现真实 WebGL2 离屏颜色与法线/深度数据，不使用预绘或画面翻转伪造反射。
4. 反射步进使用一致坐标空间，并正确处理屏幕边界、深度交叉和未命中。
5. 命中后包含区间细化或等效亚步长处理，边缘与无效命中有可见置信度衰减。
6. 四个算法参数均实时生效、输出值同步更新，并能造成可验证的画面差异。
7. 命中率、平均步数和分辨率指标取自当前结果，统计读取经过节流且不是常量。
8. 场景能清晰展示有效反射、屏幕外缺失、深度断裂和粗糙度影响四类现象。
9. 新实验具备可访问名称、错误回退和移动端无页面级横向溢出的响应式布局。
10. 新增专项检查与现有项目检查全部通过，没有控制台、网络、WebGL 或格式错误。

## 表单附加信息

- 岗位：前端 / WebGL 图形渲染工程师
- 类别：Coding / 图形渲染与游戏
- 建议对比方式：所有模型从同一基线分支各自创建独立分支；限制相同时间和工具权限；禁止读取其他参赛分支；最后使用同一评分脚本、相同 Chromium 与相同视口运行。
- 建议记录：完成时间、总 token/成本、修改文件数、自动检查结果、人工画质评分、实现说明是否与代码一致。
