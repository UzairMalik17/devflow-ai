
# Use the same major Node.js version as the project
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Enable pnpm through Corepack
RUN corepack enable

# Copy dependency manifests first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy the application source and TypeScript configuration
COPY tsconfig.json ./
COPY src ./src

# Default command: start the chunking worker
# Vercel Daemon configuration will override this for the embedding worker.
CMD ["pnpm", "worker:chunking"]
