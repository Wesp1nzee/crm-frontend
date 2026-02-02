# STAGE 1: Сборка
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем исходники
COPY . .

# Переменные окружения для сборки (внедряются в JS-бандл)
ARG VITE_API_URL=""
ARG VITE_MOCK=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MOCK=$VITE_MOCK

# Собираем
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]