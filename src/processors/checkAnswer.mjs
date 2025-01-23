import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import hasMatchingKeywords from "../utils/hasMatchingKeywords.mjs";
import logger from '../utils/logger.mjs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function checkAnswer(message) {
    const keywords = ["!الإجابة", "!الإجابه", "!اجابه", "!اجابة", "!أجابة", "!أجابه", "!answer"];
    if (!hasMatchingKeywords(message.body, keywords)) return;

    try {
        // الحصول على الرسالة المقتبسة
        const quotedMessage = await message.getQuotedMessage();

        if (!quotedMessage) return

        const quizDataPath = path.join(__dirname, '../data/quizData.json');
        // تأكد من وجود المجلد والملف
        await fs.ensureDir(path.dirname(quizDataPath));
        await fs.ensureFile(quizDataPath);

        // قراءة البيانات من الملف مع التحقق من وجود بنية صحيحة
        let quizData = [];
        try {
            quizData = await fs.readJson(quizDataPath);
        } catch (error) {
            if (error.code === 'ENOENT' || error.message.includes('Unexpected end of JSON input')) {
                quizData = [];
                await fs.writeJson(quizDataPath, quizData);
            } else {
                logger.error('Unexpected end of JSON input', error)
                throw error;
            }
        }

        // البحث عن السؤال بناءً على المعرّف
        const quizItem = quizData.find(item => item.questionId === quotedMessage._data.id.id);

        if (quizItem) {
            await message.reply(`✅ الإجابة الصحيحة هي: *${quizItem.correctAnswerText}*`);
        } else {
            await message.reply("⚠️ لم أتمكن من العثور على بيانات الاستفتاء لهذا السؤال.");
        }
    } catch (error) {
        logger.error("Error in checkAnswer:", error);
    }
}
