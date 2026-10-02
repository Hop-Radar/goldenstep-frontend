#!/bin/sh
set -eu

cat > /usr/share/nginx/html/js/env-config.js <<EOF
window.ENV = {
  NAVER_MAP_CLIENT_ID: "${NAVER_MAP_CLIENT_ID:-}",
  TMAP_APP_KEY: "${TMAP_APP_KEY:-}"
};
EOF

exec nginx -g "daemon off;"