FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (need devDeps for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Prune devDependencies
RUN npm prune --production

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
