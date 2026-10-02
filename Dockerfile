FROM nginx:1.27-alpine

COPY . /usr/share/nginx/html
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY infra/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]