import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs'
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import convertWebpToGifAndMp4 from '../../utils/convertWebpToGifAndMp4.mjs';
import logger from '../../utils/logger.mjs'

export async function convertStickerToMedia(message, MessageMedia) {
    try {


        const hasQuotedMsg = message.hasQuotedMsg;
        if (!hasQuotedMsg) return
        const keywords = ["!إرجاع", "!ارجاع", "!رجع", "!تحويل", "!استرجاع", "!back", "!restore", "!recover"];

        if (!hasMatchingKeywords(message.body, keywords)) return

        const getQuotedMessage = await message.getQuotedMessage();

        if (!getQuotedMessage.hasMedia) return
        if (getQuotedMessage?.type !== 'sticker') return


        const media = await getQuotedMessage.downloadMedia();
        if (media.mimetype !== 'image/webp') return
        const isAnimated = getQuotedMessage?._data?.isAnimated;
        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        const tempDir = config.paths.temp; // مسار مجلد الصور

        const inputFilePath = path.join(tempDir, `${uniqueId}.${isAnimated ? 'webp' : 'png'}`);
        const dataBase64 = Buffer.from(media.data, 'base64');

        await fs.ensureDir(tempDir);
        await fs.writeFile(inputFilePath, dataBase64);

        if (!isAnimated) {
            const fileBuffer = await fs.readFile(inputFilePath);
            const base64File = fileBuffer.toString('base64');
            const processedMedia = new MessageMedia('image/png', base64File, `${uniqueId}.png`);
            // إرسال الصورة المعدلة
            await message.reply(processedMedia);
            await message.reply("🔄 *تم تحويل الملصق الى صورة بنجاح!* 🖼️");
            await fs.remove(inputFilePath);

        } else {
            const gifOutputPath = path.join(tempDir, `${uniqueId}.gif`);
            const mp4OutputPath = path.join(tempDir, `${uniqueId}.mp4`);
            const result = await convertWebpToGifAndMp4(inputFilePath, gifOutputPath, mp4OutputPath);
            const fileBuffer = await fs.readFile(result.outputPath);
            const base64File = fileBuffer.toString('base64');
            const processedMedia = new MessageMedia('video/mp4', base64File, `${uniqueId}.mp4`);
            // إرسال الصورة المعدلة
            await message.reply(processedMedia, undefined, { caption: result.message }); // , sendVideoAsGif: true 
            // await message.reply("🔄 *تم تحويل الملصق الى صورة متحركة بنجاح!* 📽️");
            await fs.remove(result.outputPath);
        }

    } catch (error) {
        logger.error('Error converting image to sticker:', error);
        // await message.reply(`Error converting sticker to gif or image: ${error}`);
        throw error;
    }
}
