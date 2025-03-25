import fs from 'fs-extra';
import path from 'node:path';
import logger from '../../utils/logger.mjs';
import client from '../../client.mjs';
import { config } from '../../../config.mjs';

const ADS_FILE = path.join(config.paths.data, '/ads_keywords.json');

// قائمة الأنماط للأرقام الدولية والمحلية لجميع الدول العربية
const PHONE_PATTERNS = [
    /\b(?:\+966|00966|05\d{8})\b/, // السعودية 🇸🇦
    /\b(?:\+971|00971|05\d{8})\b/, // الإمارات 🇦🇪
    /\b(?:\+20|0020|01\d{8})\b/,   // مصر 🇪🇬
    /\b(?:\+212|00212|06\d{8})\b/, // المغرب 🇲🇦
    /\b(?:\+218|00218|09\d{8})\b/, // ليبيا 🇱🇾
    /\b(?:\+962|00962|07\d{8})\b/, // الأردن 🇯🇴
    /\b(?:\+964|00964|07\d{8})\b/, // العراق 🇮🇶
    /\b(?:\+965|00965|5\d{7})\b/,  // الكويت 🇰🇼
    /\b(?:\+973|00973|3\d{7})\b/,  // البحرين 🇧🇭
    /\b(?:\+974|00974|3\d{7})\b/,  // قطر 🇶🇦
    /\b(?:\+213|00213|05\d{8})\b/, // الجزائر 🇩🇿
    /\b(?:\+249|00249|09\d{8})\b/, // السودان 🇸🇩
    /\b(?:\+216|00216|2\d{7})\b/,  // تونس 🇹🇳
    /\b(?:\+963|00963|09\d{8})\b/, // سوريا 🇸🇾
    /\b(?:\+961|00961|03\d{6})\b/, // لبنان 🇱🇧
    /\b(?:\+967|00967|7\d{8})\b/,  // اليمن 🇾🇪
    /\b(?:\+968|00968|9\d{7})\b/,  // عمان 🇴🇲
    /\b(?:\+970|00970|05\d{8})\b/, // فلسطين 🇵🇸
    /\b(?:\+222|00222|2\d{7})\b/,  // موريتانيا 🇲🇷
];

// أنماط الأرقام المحلية (بدون مفتاح دولي)
const LOCAL_PHONE_PATTERNS = [
    /\b05\d{8}\b/, // السعودية، الإمارات، فلسطين
    /\b01\d{8}\b/, // مصر
    /\b06\d{8}\b/, // المغرب، الجزائر
    /\b07\d{8}\b/, // الأردن، العراق
    /\b09\d{8}\b/, // سوريا، السودان، ليبيا
    /\b3\d{7}\b/,  // البحرين، قطر، لبنان
];

/**
 * تحميل قائمة الكلمات المحظورة والمسموحة
 */
function loadAdKeywords() {
    try {
        if (!fs.existsSync(ADS_FILE)) {
            fs.writeJsonSync(ADS_FILE, { blacklist: [], whitelist: [] });
        }
        return fs.readJsonSync(ADS_FILE);
    } catch (error) {
        logger.error('Error loading ad keywords:', error);
        return { blacklist: [], whitelist: [] };
    }
}

/**
 * التحقق مما إذا كانت الرسالة إعلانًا
 */
function isAdMessage(message) {
    const { blacklist, whitelist } = loadAdKeywords();
    const messageText = message.body.toLowerCase();

    // استثناء الرسائل التي تحتوي على كلمات مسموحة
    if (whitelist.some(word => messageText.includes(word))) {
        return false;
    }

    // تقسيم النص إلى كلمات
    const words = messageText.split(/\s+/);

    // التحقق من وجود كلمات محظورة
    const containsBlacklistedWord = words.some(word => blacklist.includes(word));

    // التحقق من الأرقام الدولية أو المحلية
    const hasPhoneNumber =
        PHONE_PATTERNS.some(pattern => pattern.test(messageText)) ||
        LOCAL_PHONE_PATTERNS.some(pattern => pattern.test(messageText));

    // التحقق مما إذا كانت الرسالة طويلة (أكثر من 30 كلمة)
    const isLongMessage = words.length > 30;

    return containsBlacklistedWord && (hasPhoneNumber || isLongMessage);
}

/**
 * التعامل مع الإعلانات
 */
export async function handleAdMessage(message, messageMeta, chat) {
    if (!messageMeta.isGroup) return;

    if (isAdMessage(message)) {
        try {
            const senderId = message.author || message.from;
            const senderName = messageMeta.pushname || messageMeta.number;
            const botId = client.info.wid._serialized;

            // التأكد أن البوت مشرف
            const botParticipant = chat.participants.find(p => p.id._serialized === botId);
            if (!botParticipant || !botParticipant.isAdmin) return;

            // التحقق مما إذا كان المرسل مشرفًا
            const senderParticipant = chat.participants.find(p => p.id._serialized === senderId);
            if (senderParticipant && senderParticipant.isAdmin) return;

            // حذف الرسالة
            await message.delete(true).catch(() => { });

            // إرسال تحذير للمستخدم
            await chat.sendMessage(`⚠️ *تنبيه: ${senderName}، نشر الإعلانات ممنوع في هذه المجموعة. تم حذف رسالتك!*`);

        } catch (error) {
            logger.error('Error handling ad message:', error);
        }
    }
}