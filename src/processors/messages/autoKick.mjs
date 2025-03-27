import fs from 'fs-extra';
import path from "node:path";
import logger from '../../utils/logger.mjs';
import client from '../../client.mjs';
import { config } from '../../../config.mjs';

// ملف حفظ بيانات المخالفات
const DATA_FILE = path.join(config.paths.data, '/violations.json');
const DATA_DIR = path.dirname(DATA_FILE);
const WARNING_LIMIT = 1; // عدد التنبيهات قبل الطرد

// التأكد من وجود المجلد والملف
function ensureDataFile() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeJsonSync(DATA_FILE, {});
        }
    } catch (error) {
        logger.error('Error ensuring data file:', error);
    }
}

// تحميل وحفظ بيانات المخالفات
function loadViolations() {
    ensureDataFile();
    try {
        return fs.readJsonSync(DATA_FILE, { throws: false }) || {};
    } catch (error) {
        logger.error('Error loading violations data:', error);
        return {};
    }
}

function saveViolations(data) {
    ensureDataFile();
    try {
        fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
    } catch (error) {
        logger.error('Error saving violations data:', error);
    }
}

export async function autoKick(message, messageMeta, chat) {
    try {
        if (!messageMeta.isGroup) return;

        const linkPattern = /(https?:\/\/[^\s]+)/g;
        if (!linkPattern.test(message.body)) return;

        const senderId = message.author || message.from;
        const senderName = messageMeta.pushname || messageMeta.number;
        const botId = client.info.wid._serialized;

        // التحقق مما إذا كان البوت مشرفًا
        const botParticipant = chat.participants.find(p => p.id._serialized === botId);
        if (!botParticipant || !botParticipant.isAdmin) return;

        // التحقق مما إذا كان المرسل مشرفًا
        const senderParticipant = chat.participants.find(p => p.id._serialized === senderId);
        if (senderParticipant && senderParticipant.isAdmin) return;

        // حذف الرسالة
        await message.delete(true).catch(() => { });

        // تحميل المخالفات
        let violations = loadViolations();
        const chatId = chat.id._serialized;

        if (!violations[chatId]) violations[chatId] = {};
        if (!violations[chatId][senderId]) violations[chatId][senderId] = { count: 0 };

        // زيادة عدد المخالفات
        violations[chatId][senderId].count++;

        if (violations[chatId][senderId].count > WARNING_LIMIT) {
            await chat.sendMessage(`🚫 *عذرًا ${senderName}، لقد تجاوزت الحد المسموح به من التنبيهات بشأن نشر الروابط، وبناءً على ذلك، ننهي عضويتك في هذه المجموعة.*`);
            await chat.removeParticipants([senderId]).catch(() => { });

            // إعادة تعيين عدد المخالفات بعد الطرد
            delete violations[chatId][senderId];
        } else {
            await chat.sendMessage(`⚠️ *${senderName}*\nتجنّب إرسال الروابط. (تنبيه ${violations[chatId][senderId].count} من ${WARNING_LIMIT + 1})`);

        }

        // حفظ التعديلات
        saveViolations(violations);

    } catch (error) {
        logger.error('Error in autoKick:', error);
    }
}