// /processors/stickers/convertImageToStickerCircle.mjs

import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs';
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import convertImageToCircle from '../../utils/convertImageToCircle.mjs';
import convertVideoToCircleWebp from '../../utils/convertVideoToCircleWebp.mjs'; // الوظيفة الجديدة
import logger from '../../utils/logger.mjs';

export async function convertImageToStickerCircle(message, MessageMedia, messageMeta) {
    try {
        const hasQuotedMsg = message?.hasQuotedMsg;
        const keywords = ["!دائرة", "!دائره", "!circle"];
        const messageBody = message?.body || '';
        const messageCaption = message?._data?.caption || '';
        
        if (!hasMatchingKeywords(messageBody, keywords) && !hasMatchingKeywords(messageCaption, keywords)) return;

        const targetMessage = hasQuotedMsg ? await message.getQuotedMessage() : message;
        if (!targetMessage.hasMedia) return;

        const mediaType = targetMessage.type;
        const uniqueId = Date.now();
        const tempDir = config.paths.temp;
        await fs.ensureDir(tempDir);

        // معالجة الصور الثابتة
        if (mediaType === 'image') {
            const inputPath = path.join(tempDir, `input-${uniqueId}.png`);
            const outputPath = path.join(tempDir, `output-circle-${uniqueId}.png`);

            const media = await targetMessage.downloadMedia();
            await fs.outputFile(inputPath, media.data, 'base64');
            
            await convertImageToCircle(inputPath, outputPath);
            
            const imageBuffer = await fs.readFile(outputPath);
            const processedMedia = new MessageMedia('image/png', imageBuffer.toString('base64'));
            
            await message.reply(processedMedia, null, { 
                sendMediaAsSticker: true,
                stickerAuthor: messageMeta.pushname || messageMeta.number,
                stickerName: config.stickerName
            });

            await fs.remove(inputPath);
            await fs.remove(outputPath);

        // معالجة الفيديوهات والGIFs
        } else if (mediaType === 'video' || mediaType === 'gif') {
            const tempMediaPath = path.join(tempDir, `media-${uniqueId}.${mediaType === 'video' ? 'mp4' : 'gif'}`);
            const media = await targetMessage.downloadMedia();
            
            await fs.outputFile(tempMediaPath, media.data, 'base64');
            
            // تحويل إلى WebP دائري متحرك
            const outputWebPPath = await convertVideoToCircleWebp(tempMediaPath);
            const webpBuffer = await fs.readFile(outputWebPPath);
            
            const processedMedia = new MessageMedia(
                'image/webp', 
                webpBuffer.toString('base64'),
                'sticker.webp'
            );

            await message.reply(processedMedia, null, {
                sendMediaAsSticker: true,
                stickerAuthor: messageMeta.pushname || messageMeta.number,
                stickerName: config.stickerName
            });

            await fs.remove(tempMediaPath);
            await fs.remove(outputWebPPath);
        }

    } catch (error) {
        logger.error('فشل التحويل:', error);
        await message.reply("❌ حدث خطأ أثناء تحويل الميديا إلى ملصق دائري");
    }
}