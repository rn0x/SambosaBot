import PrayTimes from 'praytimes';
import { generateImageFromHtml } from './generateImage.mjs';

// إعدادات مواقيت الصلاة
const prayTimes = new PrayTimes('MWL'); // طريقة الرابطة العالمية للمساجد
const MAKKAH_COORDINATES = [21.4225, 39.8262]; // إحداثيات مكة المكرمة

export async function getNextPrayerTime() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timings = prayTimes.getTimes(today, MAKKAH_COORDINATES, +3, 0, '24h');

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    // البحث عن الصلاة التالية
    for (const prayer of prayers) {
        const [hours, minutes] = timings[prayer].split(':');
        const prayerTime = new Date(today);
        prayerTime.setHours(parseInt(hours), parseInt(minutes), 0);
        
        if (prayerTime > now) {
            const timeLeft = prayerTime - now;
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            return {
                name: getArabicPrayerName(prayer),
                time: timings[prayer],
                remaining: `${hoursLeft} ساعة ${minutesLeft} دقيقة`
            };
        }
    }

    // إذا كانت كل الصلوات انتهت، نعود لصلاة الفجر التالية
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimings = prayTimes.getTimes(tomorrow, MAKKAH_COORDINATES, +3, 0, '24h');

    return {
        name: 'الفجر',
        time: tomorrowTimings.Fajr,
        remaining: 'غداً'
    };
}

function getArabicPrayerName(englishName) {
    const names = {
        Fajr: 'الفجر',
        Dhuhr: 'الظهر',
        Asr: 'العصر',
        Maghrib: 'المغرب',
        Isha: 'العشاء'
    };
    return names[englishName] || englishName;
}

export async function createPrayerTimeSticker() {
    const prayerInfo = await getNextPrayerTime();
    const currentDate = new Date().toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const htmlTemplate = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <style>
            @font-face {
                font-family: 'Cairo';
                src: url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            }
            body {
                background: linear-gradient(135deg, #1a5e63, #0d2c4d);
                height: 100vh;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: 'Cairo', sans-serif;
            }
            .container {
                text-align: center;
                padding: 20px;
            }
            .title {
                font-size: 28px;
                margin-bottom: 15px;
                color: #FFD700;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .prayer-name {
                font-size: 42px;
                margin: 20px 0;
                color: #fff;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            }
            .time-remaining {
                font-size: 34px;
                margin: 15px 0;
                color: #FFA500;
            }
            .prayer-time {
                font-size: 38px;
                margin: 15px 0;
            }
            .date {
                font-size: 20px;
                margin-top: 25px;
                color: #ddd;
            }
            .mosque-icon {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
                filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
            }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="https://cdn-icons-png.flaticon.com/512/2097/2097080.png" class="mosque-icon" alt="Mosque">
            <div class="title">موعد الأذان القادم</div>
            <div class="prayer-name">${prayerInfo.name}</div>
            <div class="time-remaining">🕒 المتبقي: ${prayerInfo.remaining}</div>
            <div class="prayer-time">⏰ الوقت: ${prayerInfo.time}</div>
            <div class="date">📅 ${currentDate}</div>
        </div>
    </body>
    </html>
    `;

    return generateImageFromHtml({
        htmlTemplate,
        viewport: { width: 512, height: 512, deviceScaleFactor: 2 },
        retryCount: 3
    });
}