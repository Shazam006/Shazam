FROM php:8.4-apache
RUN apt-get update && apt-get install -y --no-install-recommends libonig-dev && docker-php-ext-install mbstring && rm -rf /var/lib/apt/lists/*
COPY index.html api.php /var/www/html/
RUN sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:10000>/' /etc/apache2/sites-available/000-default.conf
EXPOSE 10000
