#!/usr/bin/env bash
# 服务器一键初始化：安装 Docker → 拉取代码 → 构建并启动容器 → 装好 Nginx
# 用法（ root 用户执行 ）：
#   DOMAIN=your-domain.com EMAIL=you@example.com bash setup-server.sh
# 仅用 IP 测试时可不传 DOMAIN / EMAIL，之后再补 SSL。
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/poenglish}"
REPO="${REPO:-https://github.com/tanjixuan-06/poenglish.git}"
DOMAIN="${DOMAIN:-_}"
EMAIL="${EMAIL:-}"

echo "==> 1/5 安装 Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

DC="docker compose"
docker compose version >/dev/null 2>&1 || DC="docker-compose"

echo "==> 2/5 获取代码（$REPO）"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull --ff-only
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> 3/5 检查 .env"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'EOF'
# 必填：AI 服务密钥（服务端专用，不会进前端打包）
AI_API_KEY=
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat

# 站点地址（会被编译进产物，改了要重新 build）
NEXT_PUBLIC_SITE_URL=https://your-domain.com
EOF
  echo
  echo "⚠️  已生成 $APP_DIR/.env 模板，请先填入 AI_API_KEY 与真实域名，"
  echo "    然后重新执行本脚本。"
  exit 1
fi

echo "==> 4/5 构建并启动容器"
cd "$APP_DIR"
$DC up -d --build

echo "==> 5/5 安装 Nginx 并接入反向代理"
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y nginx
fi

CONF="/etc/nginx/sites-available/poenglish"
if [ "$DOMAIN" = "_" ]; then
  sed "s/server_name .*/server_name _;/" "$APP_DIR/deploy/nginx-poenglish.conf" > "$CONF"
else
  sed "s/server_name .*/server_name $DOMAIN www.$DOMAIN;/" "$APP_DIR/deploy/nginx-poenglish.conf" > "$CONF"
fi
ln -sf "$CONF" /etc/nginx/sites-enabled/poenglish
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable --now nginx && systemctl reload nginx

echo
echo "✅ 部署完成"
if [ "$DOMAIN" = "_" ]; then
  echo "   现在用 http://<服务器公网IP> 访问测试（备案通过前不要解析域名过来）"
else
  echo "   访问 http://$DOMAIN 。执行下面命令开通 HTTPS："
  echo "   apt-get install -y certbot python3-certbot-nginx && certbot --nginx -d $DOMAIN -d www.$DOMAIN -m ${EMAIL:-you@example.com} --agree-tos -n"
fi
