# 国内上线部署手册（轻量服务器 + Docker + Nginx + ICP 备案）

面向：**国内直连可访问**。Vercel 上的那份保留为海外演示站，两者互不影响。

---

## 0. 总览与成本

| 项目 | 说明 | 参考成本 |
|---|---|---|
| 域名 | `.cn` / `.com` | ¥30–90 / 年 |
| 轻量应用服务器 | 腾讯云，2核2G，大陆地域 | 新用户首年约 ¥60–120 |
| ICP 备案 | 个人备案 | **免费**，7–20 天 |
| AI 调用 | DeepSeek，按量 | 个人低用量约几元 / 月 |

> **为什么不用 CloudBase 云托管**：ICP 备案需要"备案服务码"，买轻量服务器会赠送，
> 云托管一般不单独提供；且轻量服务器成本更可控、没有 Serverless 超时限制，
> AI 流式输出更稳。

---

## 1. 买域名

1. 腾讯云 → 域名注册 → 搜索心仪名称
2. 后缀：`.cn`（便宜）或 `.com`（通用）
3. 买完立刻做**域名实名认证**（控制台上传身份证，通常几小时通过，未实名无法备案）
4. ⚠️ 看清**续费价**，不要只看首年优惠

## 2. 买轻量应用服务器

1. 腾讯云 → 轻量应用服务器 → **地域选大陆**（上海 / 广州 / 北京）
2. 配置：最低配（2核2G）即可
3. 镜像：Ubuntu 22.04（脚本会自己装 Docker）
4. 买完后在控制台生成**备案服务码**（备案页面可获取）

## 3. 提交 ICP 备案（个人，免费）

**材料**
- 身份证正反面照片（清晰、无反光、四角完整）
- 本人实名手机号（**管局会打电话核验，务必接听**）
- 域名证书（域名控制台下载）
- 备案服务码（来自服务器）
- 人脸核验（"腾讯云备案"小程序扫脸）

**填写要点（两个高频驳回点）**
- **网站名称**：不能含"中国/网/教育/培训"等敏感词，建议中性，如
  `诗英古诗词`、`古诗英语笔记`（3–8 个汉字最佳）
- **网站内容**：选"个人学习/兴趣分享"，**不要写付费、培训、电商**
  ——个人备案不得用于经营性内容

**时间线**：腾讯云初审 1–2 工作日 → 管局审核 7–20 天 → 短信通知

## 4. 服务器部署（备案期间即可做）

SSH 登录服务器，以 root 执行：

```bash
DOMAIN=你的域名 EMAIL=你的邮箱 bash <(curl -fsSL \
  https://raw.githubusercontent.com/tanjixuan-06/poenglish/main/deploy/setup-server.sh)
```

脚本会自动：装 Docker → 拉取代码 → 生成 `.env` 模板 → 构建启动容器 → 装 Nginx 并接入反代。

首次运行会因 `.env` 未填而停下，编辑 `/opt/poenglish/.env`，填入：

```
AI_API_KEY=sk-你的DeepSeek密钥
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
NEXT_PUBLIC_SITE_URL=https://你的域名
```

再跑一次脚本即可启动。

**备案通过前**：用 `http://服务器公网IP` 测试（不要解析域名过来）。

## 5. 备案通过后

1. 域名控制台 → 解析 → 添加 A 记录：`@` 和 `www` → 服务器公网 IP
2. 服务器上开通 HTTPS：

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名 -d www.你的域名 -m 你的邮箱 --agree-tos -n
```

3. 若换了域名，改 `.env` 的 `NEXT_PUBLIC_SITE_URL` 后**必须重新构建**
   （它是编译期变量）：

```bash
cd /opt/poenglish && docker compose up -d --build
```

---

## 6. 日常维护

```bash
cd /opt/poenglish
git pull && docker compose up -d --build   # 更新代码
docker compose logs -f --tail=100          # 看日志
docker compose restart                     # 重启
```

（certbot 证书会自动续期，无需手动处理。）

---

## 7. 常见问题

**Q：AI 讲解一直转圈不出字？**
A：Nginx 缓冲没关。确认 `deploy/nginx-poenglish.conf` 里
`proxy_buffering off;` 已生效，并执行 `nginx -t && systemctl reload nginx`。

**Q：AI 功能报错 500「服务端未配置 AI_API_KEY」？**
A：`.env` 里 `AI_API_KEY` 没填或填错。改完执行
`docker compose up -d --build` 重建（不能只 restart）。

**Q：改了域名但 sitemap 还是旧地址？**
A：`NEXT_PUBLIC_SITE_URL` 是编译期变量，**必须重新 build**，restart 无效。

**Q：3000 端口要不要开放？**
A：**不要**。容器只监听 `127.0.0.1:3000`，对外只走 Nginx 的 80/443。

---

## 8. 看流量

- **最快**：Vercel 控制台 → 项目 → **Analytics** 标签 → 开启。
  可看访问量、访客数、热门页面（免费版数据保留有限）。
- **内置方案（推荐）**：本站已预留 Umami（`app/components/Umami.tsx`，已挂载在 layout）。
  设置三个环境变量即可生效：

  | 变量 | 值示例 |
  |---|---|
  | `NEXT_PUBLIC_UMAMI_SRC` | `https://umami.example/script.js` |
  | `NEXT_PUBLIC_UMAMI_ID` | Umami 后台给的 website-id |
  | `ANALYTICS_HOST` | `https://umami.example`（CSP 放行用） |

  ⚠️ 不填 `ANALYTICS_HOST` 的话，CSP 会拦掉脚本与上报，表现为"后台一直没数据"。
  改完需重新部署（`NEXT_PUBLIC_*` 是编译期变量）。

> **注意**：国内版上线前，Vercel 上的访问数据几乎为 0——大陆无法直连 Vercel。
> 等国内服务器部署完成、域名解析过去后，流量数据才有参考价值。

## 9. 安全提醒

- `.env` 已在 `.gitignore` 中，密钥不会进仓库
- 用户自带的 BYOK 密钥只存其浏览器，服务端不保存、不记录
- 公网只暴露 80 / 443，数据库等无需开放
