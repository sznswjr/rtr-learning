# RTR4 Web Lab

静态 WebGL2 实时图形实验站点，用于展示 RTR4 章节相关的浏览器端渲染实验。

## 当前实验

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

## 知识库

- 中文 RTR4 参考内容作为 Git submodule 放在 `knowledge/Real-Time-Rendering-4th-CN`
- 章节 Markdown 位于 `knowledge/Real-Time-Rendering-4th-CN/sourceFile`
- 检出后如果目录为空，运行：

```bash
git submodule update --init --recursive
```

## 部署位置

- 源码：`/home/ubuntu/rtr4-web-lab`
- Nginx Web root：`/var/www/www.jrqz776.com`
- Nginx site：`/etc/nginx/sites-available/www.jrqz776.com`
- 域名：`www.jrqz776.com`

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
