import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan';
import { generateImageFromHtml } from './generateImage.mjs';

export async function getNextPrayerTime() {
  const now = new Date();
  const coordinates = new Coordinates(21.4225, 39.8262); // إحداثيات مكة المكرمة
  const params = CalculationMethod.UmmAlQura(); // طريقة حساب أم القرى
  const prayerTimes = new PrayerTimes(coordinates, now, params);

  // إنشاء مصفوفة بمواقيت الصلوات مع الأسماء العربية
  const prayers = [
    { name: 'الفجر', time: prayerTimes.fajr },
    { name: 'الظهر', time: prayerTimes.dhuhr },
    { name: 'العصر', time: prayerTimes.asr },
    { name: 'المغرب', time: prayerTimes.maghrib },
    { name: 'العشاء', time: prayerTimes.isha }
  ];

  // البحث عن الصلاة التالية مقارنة بالوقت الحالي
  for (const prayer of prayers) {
    if (prayer.time > now) {
      const timeLeft = prayer.time - now;
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      return {
        name: prayer.name,
        time: formatTime(prayer.time),
        remaining: `${hoursLeft} ساعة ${minutesLeft} دقيقة`
      };
    }
  }

  // إذا كانت كل الصلوات لليوم قد مضت، نحسب موعد الفجر ليوم غدٍ
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowPrayerTimes = new PrayerTimes(coordinates, tomorrow, params);
  return {
    name: 'الفجر',
    time: formatTime(tomorrowPrayerTimes.fajr),
    remaining: 'غداً'
  };
}

function formatTime(date) {
  // عرض الوقت بصيغة 24 ساعة (مثلاً: 19:45)
  return date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
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
              font-family: 'Cairo', 'Noto Naskh Arabic', 'Arial', sans-serif;
          }
          .container {
              text-align: center;
              padding: 20px;
          }
          .title {
              font-size: 43px;
              margin-bottom: 15px;
              color: #FFD700;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .prayer-name {
              font-size: 57px;
              margin: 20px 0;
              color: #fff;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          }
          .time-remaining {
              font-size: 30px;
              margin: 15px 0;
              color: #FFA500;
          }
          .prayer-time {
              font-size: 45px;
              margin: 15px 0;
          }
          .date {
              font-size: 30px;
              margin-top: 25px;
              color: #ddd;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="title">موعد الأذان القادم</div>
          <div class="prayer-name">{{name}}</div>
          <div class="time-remaining">🕒 المتبقي: {{remaining}}</div>
          <div class="prayer-time">⏰ الوقت: {{time}}</div>
          <div class="date">📅 {{currentDate}}</div>
      </div>
  </body>
  </html>
  `;

  return generateImageFromHtml({
    htmlTemplate,
    data: {
      name: prayerInfo.name,
      remaining: prayerInfo.remaining,
      time: prayerInfo.time || 'غير معروف',
      currentDate: currentDate,
    },
    viewport: { width: 512, height: 512, deviceScaleFactor: 2 },
    retryCount: 3
  });
}