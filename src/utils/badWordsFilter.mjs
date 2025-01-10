import fs from 'fs';
import path from 'path';
import { config } from '../../config.mjs';

// تحميل الكلمات السيئة من ملف النصوص
export const loadBadWords = () => {
    if (!fs.existsSync(config.paths.badwords)) {
        console.error('File "badwords.txt" not found!');
        return [];
    }

    const data = fs.readFileSync(config.paths.badwords, 'utf8');
    return data.split('\n').map(word => word.trim().toLowerCase());
};

// التحقق من وجود كلمة سيئة في الرسالة
export const checkForBadWords = async (text, message) => {
    const badWords = loadBadWords();
    const badWordFound = badWords.find(word => text.toLowerCase().includes(word));

    if (badWordFound) {
        await message.reply(`🚨 تنبيه: الرسالة تحتوي على كلمة غير لائقة: "${badWordFound}".`);
        message.delete(true);
        return true;  // إذا كانت الكلمة غير لائقة تم حذفها
    }
    return false;  // إذا لم توجد كلمات سيئة
};
