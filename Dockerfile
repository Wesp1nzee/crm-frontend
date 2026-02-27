FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

ARG VITE_API_URL=""
ARG VITE_MOCK=false

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MOCK=$VITE_MOCK

RUN npx vite build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]