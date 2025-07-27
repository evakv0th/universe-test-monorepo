FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY apps/ttk-collector ./apps/ttk-collector

WORKDIR /app/apps/ttk-collector

EXPOSE 3006