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
        menuText += `1. *!ملصق*: لتحويل صورة أو فيديو إلى ملصق (يتم اقتطاع أول 7 ثواني من الفيديو).\n`;
        menuText += `2. *!خلفية*: لإزالة الخلفية من الصورة.\n`;
        menuText += `3. *!دائرة*: لتحويل الصورة إلى شكل دائرة مع خلفية شفافة.\n`;
        menuText += `4. *!إرجاع*: لتحويل الملصق إلى صورة أو فيديو.\n`;
        menuText += `5. *!اسرق*: لسرقة الملصقات.\n`;

        // إضافة أوامر الأسئلة والإجابات
        menuText += `6. *!سؤال*: لطرح سؤال إسلامي بشكل عشوائي في جميع المجالات.\n`;
        menuText += `7. *!إجابة*: لرد على السؤال ومعرفة الإجابة.\n\n`;

        // إضافة الرسالة الختامية
        menuText += `اختر الأمر الذي تود استخدامه! 😄`;

        // إرسال الرسالة
        return await message.reply(menuText);
    } catch (error) {
        logger.error('Error sending menu response:', error);
    }
}
