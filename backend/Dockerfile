FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

CMD ["node", "index.js"]
