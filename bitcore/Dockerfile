FROM node:8.6.0
MAINTAINER n0cte <ilnur.a.g@gmail.com>

COPY ./bitcore-node.json /root/.bitcore/bitcore-node.json

RUN npm install -g bitcore

EXPOSE 3001 8333 18333

ENTRYPOINT [ "bitcored" ]