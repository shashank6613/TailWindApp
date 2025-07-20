# Use official NGINX base image
FROM nginx:stable-alpine

# Remove the default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy your static site files (HTML, CSS, JS, etc.)
COPY . /usr/share/nginx/html/

# Expose port 80 for frontend service
EXPOSE 80
