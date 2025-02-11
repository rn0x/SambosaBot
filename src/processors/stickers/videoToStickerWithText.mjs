import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs';
import convertVideoToWebp from '../../utils/convertVideoToWebp.mjs';
import addTextToVideo from '../../utils/addTextToVideo.mjs';
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import logger from '../../utils/logger.mjs';

export async function videoToStickerWithText(message, MessageMedia, messageMeta) {
    try {
        const keywords = ["!فيديو", "!video"];
        const messageText = message?.body || message?._data?.caption || '';
        if (!hasMatchingKeywords(messageText, keywords)) return;

        const extractedText = messageText.replace(/^[^\s]+\s*/, '').trim();
        const stickerAuthor = extractedText || messageMeta.pushname || messageMeta.number;

        if (!extractedText) return await message.reply(`📝 يرجى إدخال نص صحيح بعد الأمر`);

        const hasQuotedMsg = message.hasQuotedMsg;
        const targetMessage = hasQuotedMsg ? await message.getQuotedMessage() : message;
        if (!targetMessage.hasMedia) return;

        // التحقق من نوع الوسائط
        const isVideo = targetMessage.type === 'video';
        const isGif = targetMessage.type === 'image' && targetMessage.mimetype === 'image/gif';
        if (!isVideo && !isGif) return;

        const media = await targetMessage.downloadMedia();
        const uniqueId = Date.now();
        const tempDir = config.paths.temp;
        const inputPath = path.resolve(tempDir, `input-${uniqueId}.${isVideo ? 'mp4' : 'gif'}`);
        const processedPath = path.resolve(tempDir, `processed-${uniqueId}.${isVideo ? 'mp4' : 'gif'}`);
        const outputPath = path.resolve(tempDir, `output-${uniqueId}.webp`);

        await fs.ensureDir(tempDir);
        await fs.writeFile(inputPath, Buffer.from(media.data, 'base64'));

        // تحديد مسار الخط مع التأكد من أنه صالح
        const fontPath = 'Noto Sans Arabic'; // path.resolve(config.paths.public, 'fonts', 'Cairo-Bold.ttf');

        // إضافة النص إلى الفيديو أو GIF
        await addTextToVideo({
            inputFile: inputPath,
            outputFile: processedPath,
            text: extractedText,
            fontPath: fontPath || './fonts/NotoSansArabic.ttf',
            fontSize: 70,
            fontColor: 'yellow',
            maxCharsPerLine: 15,
            duration: 7,
        });

        // تحويل الفيديو أو GIF إلى WebP
        const video = await convertVideoToWebp(processedPath, outputPath);
        if (video.success) {
            const videoBuffer = await fs.readFile(video.outputPath);
            const base64Video = videoBuffer.toString('base64');
            const processedMedia = new MessageMedia('image/webp', base64Video, `${uniqueId}.webp`);
            await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor, stickerName: config.stickerName });
            await fs.remove(video.outputPath);
        }

        await fs.remove(inputPath);
        await fs.remove(processedPath);
    } catch (error) {
        console.log(error);
        logger.error('Error converting video to sticker:', error);
        throw error;
    }
}