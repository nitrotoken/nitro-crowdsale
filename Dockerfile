FROM node:8.6.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY bin /usr/src/app/bin
COPY src /usr/src/app/src

EXPOSE 8080
CMD [ "npm", "start" ]