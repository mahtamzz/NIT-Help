FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY snippets/cors.conf /etc/nginx/snippets/cors.conf
COPY snippets/proxy-common.conf /etc/nginx/snippets/proxy-common.conf
COPY snippets/protected-auth.conf /etc/nginx/snippets/protected-auth.conf
COPY docs.html /usr/share/nginx/html/docs.html

EXPOSE 4000
