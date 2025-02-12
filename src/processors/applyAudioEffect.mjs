import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { config } from '../../config.mjs';
import logger from '../utils/logger.mjs';

/**
 * دالة مساعدة لتحديد امتداد الملف بناءً على نوع الميديا
 * @param {string} mimetype - نوع الميديا (مثل audio/mp3 أو video/mp4)
 * @returns {string} الامتداد المناسب للملف
 */
function getExtension(mimetype) {
    if (mimetype.includes('mp4')) return 'mp4';
    if (mimetype.includes('mp3')) return 'mp3';
    if (mimetype.includes('wav')) return 'wav';
    if (mimetype.includes('audio/ogg')) return 'opus';
    if (mimetype.includes('audio/mpeg')) return 'mp3';
    return 'dat';
}

/**
 * دالة لتشغيل أمر ffmpeg باستخدام child_process.spawn
 * @param {string[]} args - معطيات ffmpeg
 * @returns {Promise<void>}
 */
function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', args);
        ffmpeg.stderr.on('data', (data) => {
            logger.info(`ffmpeg: ${data.toString()}`);
        });
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`ffmpeg exited with code ${code}`));
        });
    });
}

/**
 * الدالة الرئيسية لتطبيق تأثيرات الصوت على ملفات الصوت أو الفيديو.
 * يتم استدعاؤها عند تلقي أمر من المستخدم مثل "!صوت1" أو "!sound15"
 * مع إرفاق ملف صوتي أو فيديو سواء كان في الرسالة الأصلية أو رسالة مقتبسة.
 *
 * @param {Object} message - كائن الرسالة
 * @param {Object} messageMeta - بيانات إضافية عن الرسالة
 */
export async function applyAudioEffect(message, MessageMedia, messageMeta) {
    try {
        // استخراج نص الرسالة
        const messageText = message?.body || message?._data?.caption || '';

        // التعامل مع حالة الرسالة المقتبسة (quoted message)
        const hasQuotedMsg = message.hasQuotedMsg;
        const targetMessage = hasQuotedMsg ? await message.getQuotedMessage() : message;
        if (!targetMessage.hasMedia) return; // إذا لم يكن هناك ميديا، نتوقف هنا        

        // تحميل الوسائط من الرسالة الهدف
        const media = await targetMessage.downloadMedia();

        // نبحث عن أوامر التأثير مثل: !صوت1 أو !sound3 أو !sound15
        const commandRegex = /!(?:صوت|sound)\s*(\d+)/i;
        const match = messageText.match(commandRegex);
        if (!match) return; // إذا لم يكن الأمر موجودًا، نتجاهل الرسالة

        const effectNumber = parseInt(match[1], 10);
        if (isNaN(effectNumber) || effectNumber < 1 || effectNumber > 15) {
            return await message.reply('يرجى تحديد رقم التأثير بين 1 و 15، مثال: !صوت1');
        }

        // إنشاء معرف فريد ومسار للملفات المؤقتة
        const uniqueId = Date.now();
        const tempDir = config.paths.temp;
        await fs.ensureDir(tempDir);        

        const ext = getExtension(media.mimetype);
        if (ext === 'dat')  return 
        const inputFileName = path.join(tempDir, `input_${uniqueId}.${ext}`);
        const outputFileName = path.join(tempDir, `output_${uniqueId}.${ext}`);

        // حفظ الملف الذي تم تحميله (مشفّر بصيغة base64) في ملف مؤقت
        await fs.writeFile(inputFileName, Buffer.from(media.data, 'base64'));

        // تعريف 15 تأثير صوتي باستخدام فلترات FFmpeg
        const effects = {
            1: "asetrate=48000*1.5,atempo=0.66,aresample=48000",            // تأثير "تشيبمبنك" (صوت مرتفع)
            2: "asetrate=48000*0.7,atempo=1.43,aresample=48000",            // تأثير "صوت عميق" (منخفض)
            3: "aecho=0.8:0.9:1000:0.3",                                   // تأثير صدى/ريفرب
            4: "aecho=0.8:0.88:6:0.4", // تأثير روبوت
            5: "lowpass=f=300,asetrate=22050",                             // تأثير تحت الماء
            6: "highpass=f=300,lowpass=f=3000",                            // تأثير هاتف (تصفية الترددات)
            7: "acrusher=level_in=1:level_out=1:bits=8:mode=log",          // تأثير تشويش/دستورشن
            8: "areverse",                                               // عكس الصوت
            9: "atempo=0.5",                                             // تأثير تباطؤ الصوت
            10: "atempo=1.8",                                            // تأثير تسريع الصوت
            11: "asetrate=48000*1.3,atempo=0.77,aresample=48000,aecho=0.3:0.4:500:0.3",
            // تأثير مضحك (مزج تغيير الحدة مع صدى بسيط)
            12: "asetrate=48000*1.2,atempo=0.83,aresample=48000,aphaser=in_gain=0.4:out_gain=0.8:delay=0.7:decay=0.5",
            // تأثير يعطي إحساسًا بـ "الطرب"
            13: "asetrate=48000*0.8,atempo=1.25,aresample=48000,aecho=0.8:0.85:1500:0.2",
            // تأثير يجعل الصوت يبدو محزنًا
            14: "asetrate=48000*2.0,atempo=0.5,aresample=48000,aecho=0.3:0.4:300:0.2",
            // تأثير يجعل الصوت يشبه صوت طفل
            15: "asetrate=48000*0.6,atempo=1.67,aresample=48000,acrusher=level_in=1:level_out=1:bits=4:mode=log"
            // تأثير مميز (يشبه الصوت "الكاذ" بمعالجة تشويش عالية)
        };

        const filter = effects[effectNumber];
        if (!filter) {
            return await message.reply('التأثير غير موجود.');
        }

        // بناء معطيات ffmpeg بناءً على نوع الملف (صوت أو فيديو)
        let ffmpegArgs = [];
        if (media.mimetype.startsWith('audio')) {
            // معالجة ملفات الصوت
            ffmpegArgs = [
                '-y',
                '-i', inputFileName,
                '-af', filter,
                outputFileName
            ];
        } else if (media.mimetype.startsWith('video')) {
            // معالجة ملفات الفيديو: نُطبق فلتر الصوت مع نسخ الفيديو دون تغيير
            ffmpegArgs = [
                '-y',
                '-i', inputFileName,
                '-c:v', 'copy',
                '-af', filter,
                outputFileName
            ];
        } else {
            return await message.reply('نوع الملف غير مدعوم. يرجى إرسال ملف صوتي أو فيديو.');
        }

        // تشغيل أمر ffmpeg لتنفيذ التعديل
        await runFfmpeg(ffmpegArgs);

        // قراءة الملف الناتج وتحويله إلى base64
        const processedData = await fs.readFile(outputFileName);
        const base64ProcessedData = processedData.toString('base64');
        const processedMedia = new MessageMedia(media.mimetype, base64ProcessedData, `samBosaBot_${uniqueId}.${ext}`);

        // إعادة الملف المعدل إلى المستخدم
        await message.reply(processedMedia);

        // تنظيف الملفات المؤقتة
        await fs.unlink(inputFileName);
        await fs.unlink(outputFileName);
    } catch (error) {
        console.log(error);
        logger.error('Error processing audio effect:', error);
    }
}