FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm i --omit=dev
COPY . .
ENV NODE_ENV=production
# Run on /k8ui so it works behind path-based ingress
ENV BASE_PATH=/k8ui
EXPOSE 8080
CMD ["npm","start"]
