# API server / worker image (the same image runs both)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm install --no-save sequelize-cli@6

COPY . .
RUN mkdir -p uploads logs && chown -R node:node /app
USER node

EXPOSE 5000
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
