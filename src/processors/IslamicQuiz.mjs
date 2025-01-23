import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import hasMatchingKeywords from '../utils/hasMatchingKeywords.mjs';
import logger from '../utils/logger.mjs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تحميل بيانات JSON
const loadData = async () => {
    const IslamicQuizPath = path.join(__dirname, '../data/IslamicQuiz.json');
    try {
        const data = await fs.readJson(IslamicQuizPath);
        return data;
    } catch (error) {
        console.error('Failed to load JSON data:', error);
        throw new Error('Error loading data');
    }
};

// اختيار عنصر عشوائي من المصفوفة
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// ترتيب الإجابات بشكل عشوائي
const shuffleAnswers = (answers) => answers.sort(() => Math.random() - 0.5);

const data = await loadData();

export default async function IslamicQuiz(message, Poll) {
    try {
        const keywords = ["!سؤال", "!سوال", "!اسئلة", "!أسئلة", "!اسئله", "!أسئله", "!quiz"];
        if (!hasMatchingKeywords(message.body, keywords)) return;

        // اختيار فئة وموضوع ومستوى عشوائي
        const randomCategory = getRandomElement(data.mainCategories);
        const randomTopic = getRandomElement(randomCategory.topics);
        const levels = Object.keys(randomTopic.levelsData);
        const randomLevel = getRandomElement(levels);

        // اختيار سؤال عشوائي
        const questions = randomTopic.levelsData[randomLevel];
        const question = getRandomElement(questions);

        // ترتيب الإجابات بشكل عشوائي
        const shuffledAnswers = shuffleAnswers(question.answers);

        // إعداد نص الاستفتاء والأسئلة
        const pollOptions = shuffledAnswers.map((ans) => ans.answer);

        // إرسال الاستفتاء باستخدام كائن Poll
        const poll = new Poll(
            `📖 سؤال من فئة: ${randomCategory.arabicName}\n\n${question.q}`,
            pollOptions,
            { isAnonymous: true, allowsMultipleAnswers: false }
        );

        const sentMessage = await message.reply(poll);

        // قراءة البيانات الحالية من ملف quizData
        const quizDataPath = path.join(__dirname, '../data/quizData.json');

        // فحص وجود الملف وتنسيقه قبل القراءة
        let quizData = [];

        // إذا كان الملف موجودًا، اقرأ البيانات
        if (fs.existsSync(quizDataPath)) {
            try {
                quizData = await fs.readJson(quizDataPath);
            } catch (error) {
                logger.error('Invalid JSON format, initializing with empty data:', error);
                quizData = []; // إعادة تهيئة المصفوفة في حال كان التنسيق غير صالح
            }
        }

        // إضافة السؤال الجديد إلى البيانات
        const newQuiz = {
            questionId: sentMessage._data.id.id,
            correctAnswer: shuffledAnswers.findIndex(ans => ans.t === 1) + 1,
            correctAnswerText: shuffledAnswers.find(ans => ans.t === 1).answer,
        };

        quizData.push(newQuiz);

        // تأكد من أن البيانات في التنسيق الصحيح
        await fs.writeJson(quizDataPath, quizData);

    } catch (error) {
        logger.error('Failed to send quiz question:', error);
    }
}