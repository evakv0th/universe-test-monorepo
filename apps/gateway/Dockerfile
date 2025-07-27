FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY apps/gateway ./apps/gateway

WORKDIR /app/apps/gateway

EXPOSE 3000
CMD ["npm", "run", "start:dev"]