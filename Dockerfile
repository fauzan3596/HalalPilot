FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Jakarta
# better-sqlite3 memakai binary prebuilt untuk linux-x64/node22; toolchain hanya untuk fallback kompilasi
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ tzdata && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev && apt-get purge -y --auto-remove python3 make g++ || true
COPY . .
RUN chmod +x deploy/docker-entrypoint.sh && mkdir -p /data/pdf
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["sh", "deploy/docker-entrypoint.sh"]
