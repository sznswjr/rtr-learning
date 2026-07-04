# RTR4 Web Lab

静态 WebGL2 实时图形实验站点，用于展示 RTR4 章节相关的浏览器端渲染实验。

## 当前实验

- Chapter 2 图形渲染管线
  - Canvas 2D 可视化应用、几何处理、光栅化、像素处理四个阶段
  - 可调场景复杂度、裁剪模式和观察阶段
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

## 知识库

- 中文 RTR4 参考内容作为 Git submodule 放在 `knowledge/Real-Time-Rendering-4th-CN`
- 章节 Markdown 位于 `knowledge/Real-Time-Rendering-4th-CN/sourceFile`
- 检出后如果目录为空，运行：

```bash
git submodule update --init --recursive
```

## 架构约定

- 生产仍然是静态站点，不需要构建步骤。
- 首页只保留章节索引，不直接承载全部实验。
- 章节页按 URL 拆分：`chapters/chapter-2.html`、`chapters/chapter-5.html`、`chapters/chapter-6.html`。
- 首页实验导航由 `src/app/lab-registry.js` 和 `src/app/home-nav.js` 生成，章节卡片会显示实验数量、渲染后端和实验直达链接。
- 章节页内目录由 `src/app/chapter-nav.js` 从同一注册表生成。
- 页面入口脚本放在 `src/pages/`，章节实验模块放在 `src/labs/<chapter>/`。
- 新增实验时，先在 `src/app/lab-registry.js` 登记章节、标题、链接、渲染后端和摘要，再接入对应章节页面或实验模块；首页直达链接和章节页内目录会随注册表更新。
- Chapter 2 图形渲染管线实验已拆到 `src/labs/chapter-2/pipeline.js`。
- Chapter 5 实验已按主题拆到 `src/labs/chapter-5/`。
- Chapter 6 纹理过滤实验位于 `src/labs/chapter-6/texture-filtering.js`。
- `src/main.js` 只负责导入模块并按顺序初始化实验。
- 共享 Canvas、颜色、数学、着色和 WebGL 工具位于 `src/render/`。
- `package.json` 只提供本地检查脚本；生产不依赖 Node、npm 或前端包管理器。
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
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-2
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-2/*.js /var/www/www.jrqz776.com/src/labs/chapter-2/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-5
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-5/*.js /var/www/www.jrqz776.com/src/labs/chapter-5/
sudo mkdir -p /var/www/www.jrqz776.com/src/labs/chapter-6
sudo cp /home/ubuntu/rtr4-web-lab/src/labs/chapter-6/*.js /var/www/www.jrqz776.com/src/labs/chapter-6/
sudo mkdir -p /var/www/www.jrqz776.com/translations
sudo cp /home/ubuntu/rtr4-web-lab/translations/rtr4-cn.html /var/www/www.jrqz776.com/translations/rtr4-cn.html
```

## 验证

```bash
npm run check:js
npm run check:ui
git diff --check
sudo nginx -t
curl -I https://www.jrqz776.com
```

`npm run check:ui` 使用 Playwright 打开生产站点，检查首页和章节页的桌面、笔记本、平板、手机视口；会捕获 console/network 错误、横向溢出、被压成窄列的标题、关键 canvas 空白，并把截图输出到 `.tmp/ui-checks/`。

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
