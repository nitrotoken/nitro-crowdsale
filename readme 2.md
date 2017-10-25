## Установка Node.js
**Debian**
```
apt-get install npm
ln -s "$(which nodejs)" /usr/bin/node
npm install -g npm
npm install -g n
n -q stable
```

##Деплой AWS
```
eb init
eb deploy
```