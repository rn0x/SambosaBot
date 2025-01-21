import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs'
import convertVideoToWebp from '../../utils/convertVideoToWebp.mjs'


export async function convertVideoToStickerAuto(message, MessageMedia, messageMeta) {
    try {

        if (!message.hasMedia) return
        if (message?.type !== 'video' && message?.type !== 'document') return;

        const media = await message.downloadMedia();
        if (!media) return
        if (media.mimetype !== 'video/mp4' && media.mimetype !== 'image/gif') return

        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        const tempDir = config.paths.temp; // مسار مجلد الصور
        const inputPath = path.resolve(tempDir, `input-${uniqueId}.mp4`);
        const outputPath = path.resolve(tempDir, `output-${uniqueId}.webp`);

        const dataBase64 = Buffer.from(media.data, 'base64');
        await fs.ensureDir(tempDir);
        await fs.writeFile(inputPath, dataBase64);

        const video = await convertVideoToWebp(inputPath, outputPath);
        if (video.success) {
            const videoBuffer = await fs.readFile(video.outputPath);
            const base64Video = videoBuffer.toString('base64');
            const processedMedia = new MessageMedia('image/webp', base64Video, `${uniqueId}.webp`);
            // await client.sendMessage(message.from, processedMedia, { sendMediaAsSticker: true, stickerAuthor: config.defaultAuthor, stickerName: messageMeta.pushname || messageMeta.number });
            await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: config.defaultAuthor, stickerName: messageMeta.pushname || messageMeta.number });
            await fs.remove(video.outputPath);
        }

        await fs.remove(inputPath);
    } catch (error) {
        console.error('Error converting video to sticker:', error);
        throw error;
    }
}