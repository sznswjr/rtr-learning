export const labRegistry = [
  {
    id: "rendering-pipeline",
    chapter: "2",
    title: "图形渲染管线",
    summary: "应用、几何、光栅化、像素处理的阶段流动",
    href: "./chapters/chapter-2.html#rendering-pipeline",
    renderer: "canvas2d",
  },
  {
    id: "shading-models",
    chapter: "5.1",
    title: "着色模型",
    summary: "Lambert 与 Gooch 的法线、光照、视线关系",
    href: "./chapters/chapter-5.html#shading-models",
    renderer: "canvas2d",
  },
  {
    id: "light-attenuation",
    chapter: "5.2",
    title: "光源衰减",
    summary: "平方反比、窗口函数、有限影响范围",
    href: "./chapters/chapter-5.html#light-attenuation",
    renderer: "canvas2d",
  },
  {
    id: "shading-frequency",
    chapter: "5.3.1",
    title: "计算频率",
    summary: "逐物体、逐顶点、逐像素的采样差异",
    href: "./chapters/chapter-5.html#shading-frequency",
    renderer: "canvas2d",
  },
  {
    id: "aa-compare",
    chapter: "5.4",
    title: "抗锯齿对比",
    summary: "无 AA、SSAA、MSAA",
    href: "./chapters/chapter-5.html#aa-compare",
    renderer: "webgl2",
  },
  {
    id: "sampling-patterns",
    chapter: "5.4.2",
    title: "采样模式",
    summary: "像素内样本分布与覆盖率",
    href: "./chapters/chapter-5.html#sampling-patterns",
    renderer: "canvas2d",
  },
  {
    id: "transparency-compositing",
    chapter: "5.5",
    title: "透明合成",
    summary: "绘制顺序、over 操作、加权透明",
    href: "./chapters/chapter-5.html#transparency-compositing",
    renderer: "canvas2d",
  },
  {
    id: "display-encoding",
    chapter: "5.6",
    title: "显示编码",
    summary: "线性空间与 sRGB/gamma 近似",
    href: "./chapters/chapter-5.html#display-encoding",
    renderer: "canvas2d",
  },
  {
    id: "texture-filtering",
    chapter: "6",
    title: "纹理过滤",
    summary: "无过滤、双线性、三线性、SAT、各向异性过滤",
    href: "./chapters/chapter-6.html#texture-filtering",
    renderer: "canvas2d",
  },
];

export const chapterRegistry = [
  {
    id: "chapter-2",
    title: "Chapter 2 图形渲染管线",
    summary: "应用、几何、光栅化、像素处理的阶段流动",
    href: "./chapters/chapter-2.html",
    range: "Chapter 2",
  },
  {
    id: "chapter-5",
    title: "Chapter 5 着色基础",
    summary: "着色模型、光源衰减、频率、抗锯齿、采样、透明和显示编码",
    href: "./chapters/chapter-5.html",
    range: "Chapter 5.1-5.6",
  },
  {
    id: "chapter-6",
    title: "Chapter 6 纹理",
    summary: "纹理过滤、MIP、面积平均和各向异性采样",
    href: "./chapters/chapter-6.html",
    range: "Chapter 6",
  },
];

export const contentRegistry = [
  {
    id: "rtr4-cn",
    title: "RTR4 中文翻译",
    summary: "已整理 Chapter 0-2，后续章节按同一阅读页扩展",
    href: "./translations/rtr4-cn.html",
    range: "Chapter 0-2",
  },
];

export const homeNavGroups = [
  {
    label: "Translation",
    feature: true,
    entries: [contentRegistry[0]],
  },
  {
    label: "Chapters",
    entries: chapterRegistry,
  },
];
