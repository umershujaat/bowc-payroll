# Node.js application for CapRover
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY server.js ./
COPY config/ ./config/
COPY routes/ ./routes/
COPY controllers/ ./controllers/
COPY utils/ ./utils/
COPY public/ ./public/

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
