FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY apps/reporter ./apps/reporter

WORKDIR /app/apps/reporter

EXPOSE 3007