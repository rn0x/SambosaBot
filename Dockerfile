# استخدام صورة Node.js الرسمية من Docker Hub
FROM node:16-alpine

# تعيين المجلد الذي سيعمل فيه التطبيق داخل الحاوية
WORKDIR /usr/src/app

# نسخ ملفات المشروع إلى الحاوية
COPY package*.json ./ 
COPY .env ./ 
COPY config.mjs ./ 

# تثبيت التبعيات
RUN npm install

# تثبيت المتطلبات الخاصة بـ rembg عبر pip
RUN apk add --no-cache python3 py3-pip ffmpeg imagemagick
RUN python3 -m ensurepip --upgrade
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip
RUN pip install "rembg[cli]"

# نسخ باقي الملفات إلى الحاوية
COPY . .

# ضبط المنفذ الذي سيعمل عليه التطبيق
EXPOSE 3000

# تشغيل التطبيق
CMD ["npm", "start"]
