// /processors/messages/sendMenu.mjs

import { config } from '../../../config.mjs'
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import logger from '../../utils/logger.mjs'


export async function sendMenu(message, messageMeta) {
    try {
        const keywords = ["!قائمة", "!قائمه", "!القائمة", "!القائمه", "!menu", '!list'];
        if (!hasMatchingKeywords(message.body, keywords)) return

        // بداية الرسالة
        let menuText = `مرحباً ${messageMeta.pushname}! إليك قائمة الأوامر المتاحة:\n\n`;

        // إضافة الأوامر إلى الرسالة
        menuText += `1. *!ملصق*: لتحويل صورة أو فيديو إلى ملصق.\n`;
        menuText += `2. *!خلفية*: لإزالة الخلفية من الصورة.\n`;
        menuText += `3. *!دائرة*: لتحويل الصورة إلى شكل دائرة مع خلفية شفافة.\n`;
        menuText += `4. *!إرجاع*: لتحويل الملصق إلى صورة أو فيديو.\n`;
        menuText += `5. *!اسرق*: لسرقة الملصقات.\n`;
        menuText += `6. *!كتابة [رقم-النمط]*: إنشاء ملصق نصي بـ 10 أنماط فنية (مثال: !كتابة3 مرحباً)".\n`;
        menuText += `7. *!صورة [رقم-النمط]*: تحويل صورة الى ملصق مع نص بـ 10 أنماط فنية (مثال: !صورة5 مرحباً)".\n`;
        menuText += `8. *!رقمي*: لإنشاء ملصق برقم الهاتف الخاص بك.\n`;
        menuText += `9. *!صلاة*: يرسل ملصق بوقت الصلاة القادمة بتوقيت مكة المكرمة.\n`;
        menuText += `10. *!تاريخ*: يرسل ملصق يحتوي على التاريخ الهجري والميلادي الحالي.\n`;


        menuText += `11. *!سؤال*: لطرح سؤال إسلامي بشكل عشوائي في جميع المجالات.\n`;
        menuText += `12. *!إجابة*: لرد على السؤال ومعرفة الإجابة.\n\n`;
        menuText += `📌 *ملاحظات هامة:*\n\n`;
        menuText += `- يدعم الأمر !كتابة و!صورة الأرقام من 1 إلى 10 لأنماط مختلفة \n`;
        menuText += `- جودة الفيديو: يتم اقتصاص أول 7 ثواني تلقائياً\n\n`;
        menuText += `*لأوامر الميديا (!ملصق، !دائرة، !خلفية):*\n`;
        menuText += `- أرسل الصورة/الفيديو مع كتابة الأمر في _وصف الميديا_\n`;
        menuText += `- أو أرسل الأمر كـ *رد على الرسالة* المراد تحويلها\n\n`;


        // إضافة الرسالة الختامية
        menuText += `اختر الأمر الذي تود استخدامه! 😄`;

        // إرسال الرسالة
        return await message.reply(menuText);
    } catch (error) {
        logger.error('Error sending menu response:', error);
    }
}
