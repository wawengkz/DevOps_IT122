# BACKEND DOCKERFILE (Fixed for dependency issues)
# File: backend/Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with verbose logging for debugging
RUN npm install --verbose

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy application code
COPY . .

# Change ownership to non-root user AFTER copying everything
RUN chown -R nextjs:nodejs /usr/src/app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Remove health check temporarily to debug startup issues
# HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=10 \
#     CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || node -e "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]