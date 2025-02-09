import { toHijri } from 'hijri-converter';
import { generateImageFromHtml } from './generateImage.mjs';

/**
 * إنشاء ملصق بتاريخ اليوم (الميلادي والهجري).
 * @returns {Promise<string>} - صورة base64 للملصق.
 */
export async function createDateSticker() {
    const today = new Date();

    // التاريخ الميلادي
    const gregorianDate = today.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // التحويل إلى التاريخ الهجري
    const hijriDate = toHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const hijriDateFormatted = `${hijriDate.hy}/${hijriDate.hm}/${hijriDate.hd}هـ`;

    // قالب HTML لعرض التاريخ
    const htmlTemplate = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <style>
            @font-face {
                font-family: 'Changa';
                src: url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            }
            body {
                background: linear-gradient(45deg,rgb(39, 42, 22),rgb(101, 115, 58));
                height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: 'Cairo', 'Noto Naskh Arabic', 'Arial', sans-serif;
            }
            .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
            }
            .title {
                font-size: 48px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #FFD700;
            }
            .date, .hijri-date {
                font-size: 44px;
                margin: 10px 0;
                padding: 8px 15px;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.2);
            }
            .hijri-date {
                color: #FFA500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="title">📅 تاريخ اليوم</div>
            <div class="date">{{gregorianDate}}</div>
            <div class="hijri-date">{{hijriDateFormatted}}</div>
        </div>
    </body>
    </html>
    `;

    return generateImageFromHtml({
        htmlTemplate,
        data: { gregorianDate: gregorianDate, hijriDateFormatted: hijriDateFormatted },
        viewport: { width: 512, height: 512, deviceScaleFactor: 2 },
        retryCount: 3
    });
}