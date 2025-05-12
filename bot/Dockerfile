FROM node:18-slim

# Instalamos dependencias necesarias para compilar sharp
RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  libcairo2-dev \
  libjpeg-dev \
  libpango1.0-dev \
  libgif-dev \
  librsvg2-dev

WORKDIR /app

# Primero instala dependencias con la arquitectura forzada linux x64
COPY package*.json ./
RUN npm install --platform=linux --arch=x64

# Copia todo lo demás después
COPY . .

CMD ["node", "app.js"]
