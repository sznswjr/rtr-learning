# RTR4 Web Lab

静态 WebGL2 实时图形实验站点，用于展示 RTR4 章节相关的浏览器端渲染实验。

## 当前实验

- Chapter 5.4 抗锯齿
- 同一三角形在三种路径下渲染：
  - 无抗锯齿：每像素 1 个样本
  - SSAA：更高分辨率离屏渲染后线性下采样
  - MSAA：WebGL2 multisampled renderbuffer 渲染后 resolve
- 可调渲染分辨率，默认 35%，用于在高分辨率屏幕上放大观察锯齿差异

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
