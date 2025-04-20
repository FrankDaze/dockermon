# Dockerfile
FROM node:23.7.0-alpine

# Set working directory
WORKDIR /app

# Installiere Abhängigkeiten beim Bauen des Containers
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]