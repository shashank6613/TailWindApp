# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the app for production to the build folder
RUN npm run build

# Stage 2: Serve the application with Nginx
# Use a minimal Nginx image
FROM nginx:stable-alpine

# Copy the Nginx configuration from the frontend, if you have one, or create a simple one
# This config will serve the app at the /visualizer path
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the builder stage to the Nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Command to run Nginx
CMD ["nginx", "-g", "daemon off;"]
