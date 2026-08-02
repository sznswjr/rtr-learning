export const labRegistry = [
  {
    id: "rendering-pipeline",
    chapter: "2",
    title: "图形渲染管线",
    summary: "切换管线阶段与裁剪模式，观察图元和片元负载如何变化",
    href: "./chapters/chapter-2.html#rendering-pipeline",
    renderer: "canvas2d",
  },
  {
    id: "shading-models",
    chapter: "5.1",
    title: "着色模型",
    summary: "切换 Lambert、Gooch 与卡通模型，比较同一光照下的颜色响应",
    href: "./chapters/chapter-5.html#shading-models",
    renderer: "canvas2d",
  },
  {
    id: "light-attenuation",
    chapter: "5.2",
    title: "光源衰减",
    summary: "改变距离、半径和范围，观察平方反比与窗口函数如何共同限制光照",
    href: "./chapters/chapter-5.html#light-attenuation",
    renderer: "canvas2d",
  },
  {
    id: "shading-frequency",
    chapter: "5.3.1",
    title: "计算频率",
    summary: "调整采样密度，对比逐物体、逐顶点与逐像素着色的细节",
    href: "./chapters/chapter-5.html#shading-frequency",
    renderer: "canvas2d",
  },
  {
    id: "aa-compare",
    chapter: "5.4",
    title: "SSAA 与 MSAA 对比",
    summary: "降低渲染分辨率，直接比较无 AA、SSAA 与 MSAA 的边缘",
    href: "./chapters/chapter-5.html#aa-compare",
    renderer: "webgl2",
  },
  {
    id: "sampling-patterns",
    chapter: "5.4.2",
    title: "采样模式",
    summary: "改变样本分布、数量与边缘位置，观察覆盖率如何变化",
    href: "./chapters/chapter-5.html#sampling-patterns",
    renderer: "canvas2d",
  },
  {
    id: "transparency-compositing",
    chapter: "5.5",
    title: "透明合成",
    summary: "交换绘制顺序，对比 source-over 与加权透明的颜色差异",
    href: "./chapters/chapter-5.html#transparency-compositing",
    renderer: "canvas2d",
  },
  {
    id: "display-encoding",
    chapter: "5.6",
    title: "显示编码",
    summary: "调整 Gamma 与边缘对比，比较线性混合和直接编码",
    href: "./chapters/chapter-5.html#display-encoding",
    renderer: "canvas2d",
  },
  {
    id: "texture-filtering",
    chapter: "6",
    title: "纹理过滤",
    summary: "增大斜视角度，对比五种过滤的稳定性与细节保留",
    href: "./chapters/chapter-6.html#texture-filtering",
    renderer: "canvas2d",
  },
  {
    id: "environment-mapping",
    chapter: "6.4",
    title: "立方体贴图与环境映射",
    summary: "比较反射、折射与 Fresnel 混合如何使用三维方向采样环境",
    href: "./chapters/chapter-6.html#environment-mapping",
    renderer: "webgl2",
  },
  {
    id: "volume-textures",
    chapter: "6.5",
    title: "三维纹理与体积采样",
    summary: "并排观察体积切片、最大强度投影与 Alpha 累积",
    href: "./chapters/chapter-6.html#volume-textures",
    renderer: "webgl2",
  },
];

export const chapterRegistry = [
  {
    id: "chapter-2",
    title: "Chapter 2 图形渲染管线",
    summary: "从场景提交到像素合并，建立实时渲染的完整流程",
    href: "./chapters/chapter-2.html",
    range: "Chapter 2",
  },
  {
    id: "chapter-5",
    title: "Chapter 5 着色基础",
    summary: "用七个实验理解着色、采样、合成与显示编码",
    href: "./chapters/chapter-5.html",
    range: "Chapter 5.1-5.6",
  },
  {
    id: "chapter-6",
    title: "Chapter 6 纹理",
    summary: "比较纹理过滤、环境映射与三维体积采样",
    href: "./chapters/chapter-6.html",
    range: "Chapter 6",
  },
];

export const contentRegistry = [
  {
    id: "rtr4-cn",
    title: "RTR4 中文导读",
    summary: "Chapter 0-26 的完整站内导读，连接全书概念与交互实验",
    href: "./translations/rtr4-cn.html",
    range: "Chapter 0-26",
  },
];

export const homeNavGroups = [
  {
    label: "参考内容",
    feature: true,
    entries: [contentRegistry[0]],
  },
  {
    label: "实验章节",
    entries: chapterRegistry,
  },
];
