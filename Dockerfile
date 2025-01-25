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

# تثبيت المتطلبات الأساسية لنظام التشغيل والمكتبات
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    imagemagick \
    build-base \
    gcc \
    g++ \
    libffi-dev \
    musl-dev \
    libjpeg-turbo-dev \
    zlib-dev \
    pkgconfig \
    python3-dev \
    llvm \
    llvm-dev \
    clang

# إعداد بيئة Python
RUN python3 -m ensurepip --upgrade
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# تثبيت numpy مسبقًا لتجنب مشاكل numba
RUN pip install --upgrade pip setuptools wheel
RUN pip install numpy

# تثبيت الحزمة rembg
RUN pip install "rembg[cli]"

# نسخ باقي الملفات إلى الحاوية
COPY . .

# ضبط المنفذ الذي سيعمل عليه التطبيق
EXPOSE 3000

# تشغيل التطبيق
CMD ["npm", "start"]
