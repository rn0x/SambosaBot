# SambosaBot 🤖✨

بوت لتحويل الصور والفيديوهات إلى ملصقات مميزة، مع العديد من الميزات مثل إزالة الخلفيات، سرقة الملصقات، وتحويل الملصقات إلى صور وفيديوهات.


## 🛠️ المتطلبات

- **Node.js**: يمكن تحميله من [هنا](https://nodejs.org/en/).
- **Python**: يمكنك تحميل Python من [هنا](https://www.python.org/downloads/).
- **PIP**: يجب أن يكون مثبتًا مع Python (يمكنك التحقق من تثبيته عبر الأمر `pip --version`).
- **FFmpeg & ffprobe**: لتحويل الفيديوهات الى ملصقات متحركة، يمكنك تحميله من [هنا](https://ffmpeg.org/download.html).
- **ImageMagick**: لتحويل الصور، يمكن تحميله من [هنا](https://imagemagick.org/script/download.php).
- **متصفح كروم**: تأكد من أنك قد قمت بتثبيته من [هنا](https://www.google.com/chrome/).

## 🔧 التثبيت

1. **تثبيت المتطلبات:**

   تأكد من أن جميع المتطلبات مثل Node.js، Python، و FFmpeg, imagemagick, ffprobe مثبتة على جهازك.

   - خط Noto Sans Arabic `sudo apt install fonts-noto-core`
   - خط Cairo - Google Fonts

2. **تنزيل المشروع:**

   ```bash
   git clone https://github.com/rn0x/SambosaBot.git
   cd SambosaBot
   ```

3. **تثبيت الحزم باستخدام npm:**

   ```bash
   npm install
   ```

4. **تثبيت المكتبات الخاصة بـ rembg:**

   قم بتثبيت المكتبات الخاصة بـ `rembg` عبر pip:

   ```bash
   npm run install:rembg
   or
   pip install "rembg[cli]"
   ```

   هذا سيقوم بتثبيت مكتبة rembg باستخدام pip (تأكد من أن pip مثبت لديك).

## 🔐 إعدادات البيئة

يجب تعديل ملفات الإعدادات:

- **تعديل ملف `.env`**: يجب إضافة المتغيرات البيئية المطلوبة.
- **تعديل ملف `config.mjs`**: قم بتحديث المجموعات المسموح بها وأي إعدادات أخرى.

## 🚀 تشغيل المشروع

لتشغيل المشروع في وضع الإنتاج:

```bash
npm start
```

أو لتشغيله في وضع التطوير باستخدام `nodemon`:

```bash
npm run dev
```

## 🧑‍💻 الأوامر المتاحة

1. **!ملصق**: لتحويل صورة اوفيديو إلى ملصق.
2. **!خلفية**: لإزالة الخلفية من الصورة.
3. **!إرجاع**: لتحويل الملصق إلى صورة أو فيديو.
4. **!سرقة**: لسرقة الملصقات.
5. **!سؤال**: لطرح سؤال إسلامي عشوائي في جميع المجالات.
6. **!إجابة**: لرد على السؤال ومعرفة الإجابة.
7. **!دائرة**: لتحويل صورة اوفيديو الى ملصق دائري
8. **!رقمي**: لإنشاء ملصق برقم هاتفك
9. **!كتابة**: إنشاء ملصق نصي بـ 10 أنماط فنية (مثال: !كتابة3 مرحباً)
10. **!صورة**: تحويل صورة الى ملصق مع نص (مثال: !صورة7 مرحباً)
11. **!صلاة**: يرسل ملصق فيه المتبقي على الصلاة القادمة بتوقيت مكة المكرمة
12. **!تاريخ**: يرسل ملصق يحتوي على التاريخ الهجري والميلادي الحالي
13. **!توقيع**: لإنشاء ملصق توقيع مميز بـ _5 أنماط مختلفة_ (مثال: !توقيع4 فلان الفلاني).
14. **!فيديو**: لإنشاء ملصق متحرك مع نص (مثال: !فيديو مرحباً بالجميع).
15. **!صوتي**: لتطبيق تأثير صوتي على ملف صوتي أو فيديو 
16. **!تقويم**: للحصول على التقويم الهجري والميلادي لهذا اليوم

## 📦 الاعتماديات:

- `whatsapp-web.js` - مكتبة للتفاعل مع WhatsApp Web.
<!-- - `sequelize` - ORM لإدارة قاعدة البيانات. -->
- `dotenv` - تحميل المتغيرات البيئية من ملف .env.
- `nodemon` - لإعادة تحميل البوت عند تغييرات الكود.
- `rembg` - مكتبة لإزالة الخلفية من الصور عبر Python.


# طريقة التثبيت على Android باستخدام Termux

## 1. تحديث النظام:
```bash
pkg update && pkg upgrade
```

## 2. تثبيت الأدوات المطلوبة:
أولًا، قم بتثبيت `proot-distro` لتثبيت توزيعة لينكس:
```bash
pkg install proot-distro
```

## 3. تثبيت توزيعة Alpine:
```bash
proot-distro install alpine
```

## 4. دخول إلى التوزيعة المثبتة:
```bash
proot-distro login alpine
```

## 5. تحديث الحزم وتثبيت الأدوات الأساسية:
قم بتثبيت الأدوات الأساسية مثل `nmap`، إضافة المستودعات المحدثة، ثم تثبيت `chromium`:
```bash
apk update && apk add --no-cache nmap && \
echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
apk update && \
apk add --no-cache chromium
```

## 6. تثبيت Python و PIP:
```bash
apk add python3 py3-pip
```

## 7. تثبيت Node.js و NPM:
```bash
apk add --update nodejs npm
```

## 8. تثبيت FFmpeg و FFprobe:
```bash
apk add ffmpeg
```

## 9. تثبيت ImageMagick:
```bash
apk add imagemagick
```

## 10. استنساخ المستودع من GitHub:
```bash
git clone https://github.com/Alsarmad/whatsapp_adhkar
```

## 11. الدخول إلى المجلد المثبت:
```bash
cd whatsapp_adhkar
```

## 12. تثبيت التبعيات باستخدام NPM:
```bash
npm i
```

## 13. تشغيل التطبيق:
```bash
npm start
```
```

## 📞 الدعم

إذا كنت بحاجة إلى مساعدة، يمكنك التواصل عبر تيليجرام: [f93ii](https://t.me/f93ii)

## 📝 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).
