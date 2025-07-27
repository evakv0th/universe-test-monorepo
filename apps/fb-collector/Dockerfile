FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY apps/fb-collector ./apps/fb-collector

WORKDIR /app/apps/fb-collector

EXPOSE 3005