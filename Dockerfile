
# Этап 1: Собираем приложение
# Берем легкий образ Node.js для сборки
FROM node:20-alpine AS builder

# Создаем папку для работы
WORKDIR /app

# Копируем файлы с зависимостями
COPY package*.json ./

# Устанавливаем все пакеты из package.json
RUN npm ci --frozen-lockfile

# Копируем весь код приложения
COPY . .

# Собираем готовое приложение (создается папка dist/)
RUN npm run build

# Этап 2: Настраиваем веб-сервер
# Берем Nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем собранное приложение из первого этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Создаем конфиг для Nginx (чтобы React Router работал)
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Поддержка React Router - все запросы направляем на index.html' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Кеширование статических ресурсов (CSS, JS, изображения)' >> /etc/nginx/conf.d/default.conf && \
    echo '    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        expires 1y;' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "public, immutable";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# Открываем порт 80 для доступа
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
