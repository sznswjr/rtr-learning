# RTR4 Web Lab

静态 WebGL2 实时图形实验站点，用于展示 RTR4 章节相关的浏览器端渲染实验。

## 当前实验

- Chapter 1 帧预算与性能度量
  - 使用可调片元工作负载和内部渲染分辨率观察一帧如何消耗 CPU/GPU 时间预算
  - 显示目标帧率、帧时间、预算状态、内部像素数和连续帧轨迹
- Chapter 2 图形渲染管线
  - Canvas 2D 可视化应用、几何处理、光栅化、像素处理四个阶段
  - 可调场景复杂度、裁剪模式和观察阶段
- Chapter 3 重心坐标与三角形光栅化
  - WebGL2 片元着色器计算边函数、重心权重和手动属性插值
  - 可调顶点位置、采样网格与像素内样本，并可移动探针读取任意位置
- Chapter 4 模型、观察与投影变换
  - WebGL2 立方体与世界网格展示 Model、View、Projection 组合结果
  - 可追踪任意顶点在模型、世界、观察、裁剪和 NDC 空间中的坐标
- Chapter 5.1 着色模型
  - Canvas 2D 球体可视化 Lambert、Gooch、分段卡通着色
  - 可调光源方向、表面色相和高光强度
- Chapter 5.2 光源衰减
  - 可视化平方反比衰减、窗口函数和二者相乘后的有限范围衰减
- Chapter 5.3.1 计算频率
  - 对比逐物体、逐顶点、逐像素着色采样密度
- Chapter 5.4 抗锯齿
  - 同一三角形在三种路径下渲染：
    - 无抗锯齿：每像素 1 个样本
    - SSAA：更高分辨率离屏渲染后线性下采样
    - MSAA：WebGL2 multisampled renderbuffer 渲染后 resolve
- Chapter 5.4.2 采样模式
  - 可视化中心点、规则网格、旋转网格、N-Rooks、分层随机、Poisson 分布
  - 展示单像素内样本位置和一条边缘穿过像素网格时的覆盖率变化
- Chapter 5.5 透明度、Alpha 与合成
  - 对比 source-over 绘制顺序和加权顺序无关透明近似
- Chapter 5.6 显示编码
  - 展示线性空间滤波后编码与直接输出覆盖率的差异
- Chapter 6 纹理过滤
  - 对比无过滤、双线性、三线性、SAT 和各向异性过滤
  - 斜视高频纹理让 aliasing、MIP 模糊、面积平均和各向异性保细节的差异更明显
- Chapter 7 阴影贴图
  - 使用真实深度纹理完成光源视角和相机视角两遍渲染
  - 可比较深度、阴影因子和最终着色，并调节分辨率、偏移与 PCF 核大小
- Chapter 8 HDR 与显示变换
  - 使用 `RGBA16F` 离屏缓冲保存高动态范围场景，再进行曝光和色调映射
  - 对比截断、Reinhard 与 ACES，并观察线性输出、sRGB 编码和伪彩色亮度
- Chapter 9 微表面 BRDF
  - 以 GGX、Smith 和 Schlick 组成的 Cook-Torrance 模型渲染粗糙度与金属度矩阵
  - 可单独查看分布项 D、菲涅耳项 F、几何项 G，或组合后的完整 BRDF
- Chapter 10.4 立方体贴图与环境映射
  - 使用程序生成的六面 Cube Map 对比反射、折射和 Fresnel 混合
  - 可调观察角度、表面粗糙度和折射率
- Chapter 12 Bloom 后处理帧图
  - 使用四个 `RGBA16F` 中间目标依次执行 HDR 场景、亮度提取、水平/垂直模糊和最终合成
  - 可观察每个中间缓冲，并调节软阈值、模糊半径、Bloom 强度和曝光
- Chapter 14.3 三维纹理与体积采样
  - 使用 WebGL2 `TEXTURE_3D` 并排展示切片、最大强度投影和 Alpha 累积
  - 可调切片轴、切片位置、射线步数、密度阈值和体素插值

## 知识库

- 中文 RTR4 参考内容作为 Git submodule 放在 `knowledge/Real-Time-Rendering-4th-CN`
- 章节 Markdown 位于 `knowledge/Real-Time-Rendering-4th-CN/sourceFile`
- `translations/rtr4-cn.html` 提供 Chapter 0-26 的完整站内导读、关键主题索引和相关交互实验入口
- 检出后如果目录为空，运行：

```bash
git submodule update --init --recursive
```

## 架构约定

- 生产仍然是静态站点，不需要构建步骤。
- 首页只保留章节索引，不直接承载全部实验。
- Chapter 1-26 均有独立静态路由 `chapters/chapter-<n>.html`；尚未实现实验的 14 个章节显示规划页。
- 规划页由 `scripts/generate-chapter-pages.mjs` 根据 `chapterRegistry` 生成并提交到仓库，生产环境仍不需要构建步骤。
- 首页实验导航由 `src/app/lab-registry.js` 和 `src/app/home-nav.js` 生成，章节卡片会显示实验数量、渲染后端和实验直达链接。
- 章节页内目录由 `src/app/chapter-nav.js` 从同一注册表生成。
- 长章节在手机端保留横向 sticky 目录；中文导读在桌面端使用可滚动章节栏，Chapter 2 管线图和 Chapter 6 纹理对比会在窄屏重新排版，而不是缩小桌面画布。
- 页面入口脚本放在 `src/pages/`，章节实验模块放在 `src/labs/<chapter>/`。
- 新增实验时，先在 `src/app/lab-registry.js` 登记章节、标题、链接、渲染后端和摘要，再接入对应章节页面或实验模块；首页直达链接和章节页内目录会随注册表更新。
- Chapter 2 图形渲染管线实验已拆到 `src/labs/chapter-2/pipeline.js`。
- Chapter 1 帧预算实验位于 `src/labs/chapter-1/frame-budget.js`。
- Chapter 3 重心坐标实验位于 `src/labs/chapter-3/barycentric-rasterization.js`。
- Chapter 4 坐标变换实验位于 `src/labs/chapter-4/coordinate-transforms.js`。
- Chapter 5 实验已按主题拆到 `src/labs/chapter-5/`。
- Chapter 6 只保留纹理过滤实验；旧环境映射和体积纹理锚点作为兼容入口，分别指向 Chapter 10.4 和 Chapter 14.3。
- Chapter 7 阴影贴图、Chapter 8 HDR 显示变换和 Chapter 9 微表面 BRDF 分别位于对应的 `src/labs/chapter-7/`、`chapter-8/`、`chapter-9/` 目录。
- 环境映射位于 `src/labs/chapter-10/`，Bloom 后处理帧图位于 `src/labs/chapter-12/`，体积纹理位于 `src/labs/chapter-14/`。
- `src/main.js` 只负责导入模块并按顺序初始化实验。
- 共享 Canvas、颜色、数学、着色和 WebGL 工具位于 `src/render/`。
- 相机、矩阵变换、立方体与平面网格、深度/浮点 Framebuffer、GPU Timer Query 与后处理基础模块也位于 `src/render/`，供后续章节实验复用。
- `package.json` 只提供本地检查脚本；生产不依赖 Node、npm 或前端包管理器。
- 纹理与着色滑杆使用逐帧合并和预览质量，松手后恢复全质量，避免主线程连续重绘。
- 修改 JavaScript 模块时，除了更新 `index.html` 里的入口 query-string，也要同步更新静态 import URL 上的版本号，避免 Nginx 7 天缓存命中旧模块。

## 部署位置

- 源码：`/home/ubuntu/rtr4-web-lab`
- Nginx Web root：`/var/www/www.jrqz776.com`
- Nginx site：`/etc/nginx/sites-available/www.jrqz776.com`
- 域名：`www.jrqz776.com`

## 部署命令

```bash
sudo cp /home/ubuntu/rtr4-web-lab/index.html /var/www/www.jrqz776.com/index.html
sudo cp /home/ubuntu/rtr4-web-lab/src/main.js /var/www/www.jrqz776.com/src/main.js
sudo cp /home/ubuntu/rtr4-web-lab/src/styles.css /var/www/www.jrqz776.com/src/styles.css
sudo mkdir -p /var/www/www.jrqz776.com/chapters
sudo cp /home/ubuntu/rtr4-web-lab/chapters/*.html /var/www/www.jrqz776.com/chapters/
sudo mkdir -p /var/www/www.jrqz776.com/src/app
sudo cp /home/ubuntu/rtr4-web-lab/src/app/*.js /var/www/www.jrqz776.com/src/app/
sudo mkdir -p /var/www/www.jrqz776.com/src/pages
sudo cp /home/ubuntu/rtr4-web-lab/src/pages/*.js /var/www/www.jrqz776.com/src/pages/
sudo mkdir -p /var/www/www.jrqz776.com/src/render
sudo cp /home/ubuntu/rtr4-web-lab/src/render/*.js /var/www/www.jrqz776.com/src/render/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-1
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-1/*.js /var/www/www.jrqz776.com/src/labs/chapter-1/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-2
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-2/*.js /var/www/www.jrqz776.com/src/labs/chapter-2/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-3
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-3/*.js /var/www/www.jrqz776.com/src/labs/chapter-3/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-4
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-4/*.js /var/www/www.jrqz776.com/src/labs/chapter-4/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-5
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-5/*.js /var/www/www.jrqz776.com/src/labs/chapter-5/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-6
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-6/*.js /var/www/www.jrqz776.com/src/labs/chapter-6/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-7
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-7/*.js /var/www/www.jrqz776.com/src/labs/chapter-7/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-8
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-8/*.js /var/www/www.jrqz776.com/src/labs/chapter-8/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-9
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-9/*.js /var/www/www.jrqz776.com/src/labs/chapter-9/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-10
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-10/*.js /var/www/www.jrqz776.com/src/labs/chapter-10/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-12
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-12/*.js /var/www/www.jrqz776.com/src/labs/chapter-12/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-14
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-14/*.js /var/www/www.jrqz776.com/src/labs/chapter-14/
sudo mkdir -p /var/www/www.jrqz776.com/translations
sudo cp /home/ubuntu/rtr4-web-lab/translations/rtr4-cn.html /var/www/www.jrqz776.com/translations/rtr4-cn.html
```

## 验证

```bash
npm run check:js
npm run check:color
npm run check:chapters
npm run check:ui
git diff --check
sudo nginx -t
curl -I https://www.jrqz776.com
```

`npm run check:color` 检查 HSL 的标准色相换算。`npm run check:chapters` 检查 14 个生成式规划页是否与注册表一致。`npm run check:ui` 会先检查 Chapter 1-26 路由，再使用 Playwright 检查首页、12 个已实现章节页和中文导读的桌面、笔记本、平板、手机视口；会捕获 console/network 错误、横向溢出、被压成窄列的标题、关键 canvas 空白、Canvas 可访问名称、sticky 导航、窄屏画布布局与关键滑杆响应时间，并把截图输出到 `.tmp/ui-checks/`。

如需检查尚未部署的工作区，可先启动本地静态服务器，再传入地址：

```bash
npm run check:ui -- http://127.0.0.1:4173
```

## DNS

在 Spaceship 的 Advanced DNS 中添加：

```text
Type: A
Host: www
Value: 43.165.171.23
TTL: Automatic
```

DNS 生效后可签发证书：

```bash
sudo certbot --nginx -d www.jrqz776.com
```
