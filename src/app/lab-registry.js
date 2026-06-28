export const labRegistry = [
  {
    id: "rendering-pipeline",
    chapter: "2",
    title: "图形渲染管线",
    summary: "应用、几何、光栅化、像素处理的阶段流动",
    href: "#rendering-pipeline",
    renderer: "canvas2d",
  },
  {
    id: "shading-models",
    chapter: "5.1",
    title: "着色模型",
    summary: "Lambert 与 Gooch 的法线、光照、视线关系",
    href: "#shading-models",
    renderer: "canvas2d",
  },
  {
    id: "light-attenuation",
    chapter: "5.2",
    title: "光源衰减",
    summary: "平方反比、窗口函数、有限影响范围",
    href: "#light-attenuation",
    renderer: "canvas2d",
  },
  {
    id: "shading-frequency",
    chapter: "5.3.1",
    title: "计算频率",
    summary: "逐物体、逐顶点、逐像素的采样差异",
    href: "#shading-frequency",
    renderer: "canvas2d",
  },
  {
    id: "aa-compare",
    chapter: "5.4",
    title: "抗锯齿对比",
    summary: "无 AA、SSAA、MSAA",
    href: "#aa-compare",
    renderer: "webgl2",
  },
  {
    id: "sampling-patterns",
    chapter: "5.4.2",
    title: "采样模式",
    summary: "像素内样本分布与覆盖率",
    href: "#sampling-patterns",
    renderer: "canvas2d",
  },
  {
    id: "transparency-compositing",
    chapter: "5.5",
    title: "透明合成",
    summary: "绘制顺序、over 操作、加权透明",
    href: "#transparency-compositing",
    renderer: "canvas2d",
  },
  {
    id: "display-encoding",
    chapter: "5.6",
    title: "显示编码",
    summary: "线性空间与 sRGB/gamma 近似",
    href: "#display-encoding",
    renderer: "canvas2d",
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
    label: "2",
    entries: [labRegistry[0]],
  },
  {
    label: "5.1 - 5.3",
    entries: labRegistry.slice(1, 4),
  },
  {
    label: "5.4",
    entries: labRegistry.slice(4, 6),
  },
  {
    label: "5.5 - 5.6",
    entries: labRegistry.slice(6, 8),
  },
];
