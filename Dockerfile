FROM node:12.14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080
CMD [ "node", "typetune.js", "NODE_ENV=production" ]
