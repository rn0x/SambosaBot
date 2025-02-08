// processors/stickers/videoToSticker.mjs

import { exec } from 'child_process';
import util from 'util';
import fs from 'fs-extra';
import path from 'path';
import logger from '../../utils/logger.mjs';
import { config } from '../../../config.mjs';

const execPromise = util.promisify(exec);

// إعدادات النمط الواحد من الكونفيج
const textStyle = {
    fontPath: path.join(config.paths.public, 'fonts/Cairo-Regular.ttf'),
    color: "#FFFFFF",
    fontSize: "64px",
    shadow: "2px 2px 8px rgba(0,0,0,0.7)",
    bgOpacity: 0.4
};

export default async function videoToSticker(message, MessageMedia, messageMeta) {
    try {
        // التحقق من وجود فيديو
        let media;
        let commandText = '';

        if (message.hasMedia) {
            media = await message.downloadMedia();
            commandText = message.body || message._data?.caption || '';
        } else if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.hasMedia) {
                media = await quotedMsg.downloadMedia();
                commandText = message.body;
            }
        }

        if (!media || !media.mimetype.startsWith('video/')) return;

        // معالجة الأمر الجديد بدون رقم النمط
        const commandMatch = commandText.match(/^!فيديو\s+(.+)/);
        if (!commandMatch) return;

        const text = commandMatch[1].trim();
        if (!text) {
            return await message.reply('📝 يرجى إدخال نص صحيح مثال: !فيديو السلام عليكم');
        }

        await message.reply(`⏳ جاري معالجة الفيديو...`);

        // إنشاء مجلد مؤقت
        const tempDir = path.join(config.temp, `video_${Date.now()}`);
        await fs.ensureDir(tempDir);

        // حفظ الفيديو المؤقت
        const inputPath = path.join(tempDir, 'input.mp4');
        await fs.writeFile(inputPath, media.data, 'base64');

        // معالجة الفيديو
        await processVideo({
            inputPath,
            tempDir,
            text,
            maxDuration: 7
        });

        // ضغط الفيديو النهائي
        const outputPath = path.join(tempDir, 'output.webm');
        await compressVideo(inputPath, outputPath);

        // التحويل إلى قاعدة 64
        const outputBuffer = await fs.readFile(outputPath);
        const base64Video = outputBuffer.toString('base64');

        // الإرسال كملصق
        const videoMedia = new MessageMedia('video/webm', base64Video, 'sticker.webm');
        await message.reply(videoMedia, null, {
            sendMediaAsSticker: true,
            stickerAuthor: messageMeta.pushname || messageMeta.number,
            stickerName: config.stickerName,
            stickerCategories: ['🎥', '✨']
        });

        // التنظيف
        await fs.remove(tempDir);

    } catch (error) {
        logger.error('فشل إنشاء ملصق الفيديو:', error);
        await message.reply('❌ فشل في معالجة الفيديو، يرجى المحاولة بفيديو أقصر');
    }
}

async function processVideo({ inputPath, tempDir, text, maxDuration }) {
    const commands = [
        `-t ${maxDuration}`,
        `-vf "` +
        `scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,` +
        `drawtext=fontfile='${textStyle.fontPath}':text='${text}':` +
        `fontcolor='${textStyle.color}':fontsize=${calculateFontSize(text.length)}:` +
        `box=1:boxcolor=black@${textStyle.bgOpacity}:boxborderw=10:` +
        `x=(w-text_w)/2:y=h-text_h-20:` +
        `shadowcolor=black@0.8:shadowx=2:shadowy=2` +
        `"`,
        `-c:v libvpx-vp9 -crf 30 -b:v 512k`,
        `${tempDir}/processed.webm`
    ];

    await execPromise(`ffmpeg -i ${inputPath} ${commands.join(' ')}`);
}

function calculateFontSize(textLength) {
    let size = parseInt(textStyle.fontSize);
    if (textLength > 40) size -= 12;
    else if (textLength > 25) size -= 8;
    return Math.max(size, 36); // الحد الأدنى 36px
}

async function compressVideo(inputPath, outputPath) {
    await execPromise(`ffmpeg -i ${inputPath} -vf "fps=15,scale=512:512" -c:v libvpx-vp9 -b:v 300k ${outputPath}`);
}