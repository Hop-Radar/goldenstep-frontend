#!/bin/sh
set -eu

cat > /usr/share/nginx/html/js/env-config.js <<EOF
window.ENV = {
  NAVER_MAP_CLIENT_ID: "${NAVER_MAP_CLIENT_ID:-}"
};
EOF

exec nginx -g "daemon off;"