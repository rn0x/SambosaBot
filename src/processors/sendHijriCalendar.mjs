// processors/sendHijriCalendar.mjs

import fs from 'fs-extra';
import path from 'path';
import { config } from '../../config.mjs';
import { toHijri } from 'hijri-converter';
import { generateImageFromHtml } from '../utils/generateImage.mjs';
import hasMatchingKeywords from '../utils/hasMatchingKeywords.mjs';


// دالة مساعدة لترقيم الأرقام بحيث تكون بصيغة 01، 02...
const pad = (num) => (num < 10 ? `0${num}` : num);

// دالة مساعدة لتنسيق التاريخ الميلادي بصيغة dd-mm-yyyy
const formatGregorianDate = (date) => {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

// دالة للحصول على اسم اليوم بالعربية
const getArabicDayName = (date) => {
    return new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(date);
};


export async function sendHijriCalendar(message, MessageMedia) {
    try {

        const body = message?.body?.trim();
        const keywords = ['!تقويم', '!التقويم', '!calendar'];
        if (!hasMatchingKeywords(body, keywords)) return;

        // الحصول على التاريخ الحالي
        const imagesIslamPath = path.join(config.paths.public, 'images', 'خلفيات-اسلامية.jpg');
        const imageBuffer = await fs.readFile(imagesIslamPath).catch(() => { });
        const imageBase64 = imageBuffer.toString('base64');
        const imageUri = `data:image/jpeg;base64,${imageBase64}`;
        const today = new Date();
        const gregorianDate = formatGregorianDate(today);

        // الحصول على اسم اليوم الحالي
        const arabicDayName = getArabicDayName(today);

        // تحويل التاريخ الميلادي إلى هجري باستخدام مكتبة hijri-converter
        // نفترض أن الدالة toHijri تأخذ (year, month, day) وتعيد مصفوفة [hYear, hMonth, hDay]
        const hjDate = toHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
        const hijriDate = `${pad(hjDate.hy)}-${pad(hjDate.hm)}-${hjDate.hd}`;

        // قراءة بيانات الدعاء والحديث من ملفات JSON
        const dataPath = path.join(config.paths.public, 'json');
        const duaPath = path.join(dataPath, 'dua.json');

        // اختيار ملف الحديث عشوائيًا من الثلاثة: مسلم، بخاري، وابوداؤد
        const hadithFiles = ['muslim.json', 'bukhari.json', 'abudawud.json'];
        const selectedHadithFile = hadithFiles[Math.floor(Math.random() * hadithFiles.length)];
        const hadithPath = path.join(dataPath, 'hadith', selectedHadithFile);

        const duas = await fs.readJSON(duaPath);
        const hadiths = await fs.readJSON(hadithPath);

        // اختيار دعاء وحديث عشوائي من القائمة
        const randomDua = duas[Math.floor(Math.random() * duas.length)];
        const randomHadith = hadiths.hadiths[Math.floor(Math.random() * hadiths.hadiths.length)];

        // قالب HTML مع وجود عناصر متغيرة بداخل {{ }}
        const htmlTemplate = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>قالب التقويم الهجري</title>
    <!-- تضمين خط Cairo -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Cairo', sans-serif;
        }
        body {
            background: #f5f5f5;
            direction: rtl;
            color: #333;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: url('{{imageUri}}') no-repeat center center/cover;
            height: 250px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
        }
        .header h1 {
            position: relative;
            color: #fff;
            font-size: 2.5em;
            z-index: 1;
        }
        .content {
            padding: 20px;
        }
        .date-info {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 20px;
        }
        .date-item {
            flex: 1;
            min-width: 150px;
            background: #e9ecef;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
        }
        .section {
            margin-bottom: 20px;
            background: #f8f9fa;
            padding: 15px;
            border-left: 5px solid #007bff;
            border-radius: 5px;
        }
        .section h3 {
            margin-bottom: 10px;
            font-size: 1.2em;
            color: #007bff;
        }
        .footer {
            background: #343a40;
            color: #fff;
            text-align: center;
            padding: 15px;
            font-size: 0.9em;
        }
        .share {
            margin-top: 10px;
        }
        .social {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 10px;
        }
        .social a {
            color: #fff;
            text-decoration: none;
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- رأس القالب مع صورة خلفية -->
        <div class="header">
            <h1>{{dayName}}</h1>
        </div>
        <div class="content">
            <!-- معلومات التاريخ -->
            <div class="date-info">
                <div class="date-item">
                    <h3>التاريخ الهجري</h3>
                    <p>{{hijriDate}}</p>
                </div>
                <div class="date-item">
                    <h3>التاريخ الميلادي</h3>
                    <p>{{gregorianDate}}</p>
                </div>
            </div>
            <!-- قسم الدعاء -->
            <div class="section">
                <h3>دعاء اليوم</h3>
                <p>{{dua}}</p>
            </div>
            <!-- قسم الحديث -->
            <div class="section">
                <h3>حديث اليوم</h3>
                <p>{{hadith}}</p>
            </div>
        </div>
        <!-- تذييل القالب -->
        <div class="footer">
            <p>© 2025 جميع الحقوق محفوظة بوت سمبوسه</p>
            <div class="share">
                <p>لا تنسى مشاركة التقويم الهجري</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

        const caption = `
🗓️ *تقويم اليوم* - ${arabicDayName}
📆 *التاريخ الميلادي:* ${gregorianDate}
🌙 *التاريخ الهجري:* ${hijriDate}
🙏 *دعاء اليوم:* ${randomDua}
📖 *حديث اليوم:* ${randomHadith.arabic}
        `.trim();

        // توليد الصورة من القالب HTML باستخدام generateImageFromHtml
        // يمكن تعديل إعدادات viewport حسب متطلباتك
        const base64Image = await generateImageFromHtml({
            htmlTemplate,
            data: {
                imageUri: imageUri,
                dayName: arabicDayName,
                hijriDate,
                gregorianDate,
                dua: randomDua,
                hadith: randomHadith.arabic
            },
            viewport: { width: 800, height: 0 }
        });

        const media = new MessageMedia('image/png', base64Image, 'calendar.png');

        // إرسال الصورة إلى المستخدم
        await message.reply(media, undefined, { caption: caption });

    } catch (error) {
        console.error('Error sending Hijri calendar:', error);
    }
}
