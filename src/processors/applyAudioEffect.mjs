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
        if (ext === 'dat') return
        const inputFileName = path.join(tempDir, `input_${uniqueId}.${ext}`);
        const outputFileName = path.join(tempDir, `output_${uniqueId}.${ext}`);

        // حفظ الملف الذي تم تحميله (مشفّر بصيغة base64) في ملف مؤقت
        await fs.writeFile(inputFileName, Buffer.from(media.data, 'base64'));

        // تعريف 15 تأثير صوتي باستخدام فلترات FFmpeg
        const effects = {
            1: "rubberband=pitch=0.5:tempo=1.0, lowpass=1500, aecho=0.8:0.9:500:0.5",
            // تأثير الروبوت الثقيل (مثل Transformers)

            2: "compand=attacks=0.1:points=-90/-90|-30/-10|0/-0, stereowiden",
            // صوت فخم سينمائي (تعزيز العمق والاستريو)

            3: "asetrate=48000*1.8, atempo=0.55, highpass=300, vibrato=f=15:d=0.3",
            // صوت طفل واقعي (طبقة عالية + اهتزاز خفيف)

            4: "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75, aphaser=type=t, flanger, vibrato=f=10",
            // تأثير روبوت

            5: "aecho=0.8:0.9:1000:0.3",
            // تأثير صدى/ريفرب

            6: "chorus=0.5:0.9:50:0.4:0.25:2, rubberband=pitch=1.2",
            // تأثير الجوقة السماوي (طبقات صوتية متعددة)

            7: "areverse",
            // عكس الصوت

            8: "firequalizer=gain_entry='entry(0, -20); entry(1000, 0); entry(4000,15)'",
            // الصوت الميتافيزيقي (تعزيز الترددات الغريبة)

            9: "acrusher=level_in=1:level_out=1:bits=8:mode=log",
            // تأثير تشويش/دستورشن

            10: "vibrato=f=2.5:d=1.0, asetrate=48000*0.85",
            // تأثير السكارى (اهتزاز بطيء + طبقة منخفضة)

            11: "bass=g=10:f=60:w=0.5, lowpass=f=120, volume=90",
            // تأثير السينما المنزلية (تعزيز الـ Bass والـ LFE)

            12: "atempo=0.75, asetrate=44100*1.2, aecho=0.8:0.9:1000:0.3, bass=g=-10:f=50:w=0.8",
            // تأثيرًا صوتيًا مرعبًا لخلق جو من الرعب

            13: "adelay=1500|1500, aecho=0.7:0.7:30:0.7",
            // تأثير الغرفة السرية (صدى غامض مع تأخير)

            14: "atempo=1.5, asetrate=44100*1.5, afftdn",
            // تأثر مضحك

            15: "aecho=0.8:0.9:500:0.4, aecho=0.7:0.8:1000:0.5, atempo=0.85, asetrate=44100*0.8, bass=g=-12:f=120:w=0.6, volume=1.5"
            // تاثير تكرار
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