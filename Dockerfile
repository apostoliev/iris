FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

RUN chmod +x ./start-with-migrations.sh

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["./start-with-migrations.sh"]
