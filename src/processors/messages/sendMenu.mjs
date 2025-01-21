// /processors/messages/sendMenu.mjs

import { config } from '../../../config.mjs'
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';

export async function sendMenu(message, messageMeta) {
    try {
        const keywords = ["!قائمة", "!قائمه", "!القائمة", "!القائمه", "!menu", '!list'];
        if (!hasMatchingKeywords(message.body, keywords)) return

        // بداية الرسالة
        let menuText = `مرحباً ${messageMeta.pushname}! إليك قائمة الأوامر المتاحة:\n\n`;

        // إضافة الأوامر إلى الرسالة
        menuText += `1. *!ملصق*: لتحويل صورة إلى ملصق.\n`;
        menuText += `2. *!متحرك*: لتحويل فيديو إلى ملصق متحرك.\n`;
        menuText += `3. *!خلفية*: لإزالة الخلفية من الصورة.\n`;
        menuText += `4. *!إرجاع*: لتحويل الملصق إلى صورة أو فيديو.\n`;
        menuText += `5. *!سرقة*: لسرقة الملصقات.\n\n`;

        // إضافة الرسالة الختامية
        menuText += `اختر الأمر الذي تود استخدامه! 😄`;

        // إرسال الرسالة
        await message.reply(menuText);
    } catch (error) {
        console.error('Error sending menu response:', error);
    }
}
