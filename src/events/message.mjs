// /events/message.mjs

import path from 'path';
import fs from 'fs-extra';
import client from '../client.mjs'
import { config } from '../../config.mjs';
import logger from '../utils/logger.mjs'
import { convertImageToStickerBg } from '../processors/stickers/convertImageToStickerBg.mjs';
import { stealSticker } from '../processors/stickers/stealSticker.mjs';
import { convertVideoToStickerAuto } from '../processors/stickers/convertVideoToStickerAuto.mjs';
import { convertImageToStickerAuto } from '../processors/stickers/convertImageToStickerAuto.mjs';
import { convertMediaToSticker } from '../processors/stickers/convertMediaToSticker.mjs';
import { convertStickerToMedia } from '../processors/stickers/convertStickerToMedia.mjs';
import { sendMenu } from '../processors/messages/sendMenu.mjs';
import { handleSpam } from '../processors/spamHandler.mjs';
import { convertImageToStickerCircle } from '../processors/stickers/convertImageToStickerCircle.mjs';
import IslamicQuiz from '../processors/IslamicQuiz.mjs';
import checkAnswer from '../processors/checkAnswer.mjs';
import hasMatchingKeywords from '../utils/hasMatchingKeywords.mjs';
import textToSticker from '../processors/stickers/textToSticker.mjs';
import imageToSticker from '../processors/stickers/imageToSticker.mjs';

export default function message(client, MessageMedia, Poll) {
    client.on('message', async (message) => {
        try {
            const groupIDs = config.allowedGroups;
            const getChat = await message.getChat();
            const getContact = await message.getContact();
            // تجميع المعلومات في كائن واحد
            const messageMeta = {
                pushname: getContact.pushname || getContact.verifiedName || message._data.notifyName,
                userid: getContact.id._serialized,
                number: getContact.number,
                id: message.from,
                isForwarded: message.isForwarded,
                deviceType: message.deviceType,
                isGroup: message.from.includes('@g.us'),
                chatName: getChat.name,
            };

            // التعامل مع الروابط
            if (messageMeta.isGroup && /https?:\/\/\S+/i.test(message.body)) {
                return await message.delete(true).catch(() => { }); // حذف الرسالة
            }

            // التعامل مع السبام
            await handleSpam(message, messageMeta);

            // نلقائي يعمل في قروبات معينة فقط
            // اذا اردت ان يعمل في جميع القروبات قم بحذف الشرط  && groupIDs.includes(messageMeta.id)
            if (messageMeta.isGroup && groupIDs.includes(messageMeta.id)) {
                if (config.toStickerAuto) {
                    await convertImageToStickerAuto(message, MessageMedia, messageMeta);
                    await convertVideoToStickerAuto(message, MessageMedia, messageMeta);
                }
            }

            // جميع المعالجات أو الأوامر
            await convertMediaToSticker(message, MessageMedia, messageMeta);
            await convertImageToStickerCircle(message, MessageMedia, messageMeta);
            await convertImageToStickerBg(message, MessageMedia, messageMeta);
            await stealSticker(message, MessageMedia, messageMeta);
            await convertStickerToMedia(message, MessageMedia);
            await textToSticker(message, MessageMedia, messageMeta);
            await imageToSticker(message, MessageMedia, messageMeta);
            await sendMenu(message, messageMeta);

            if (!groupIDs.includes(messageMeta.id)) {
                await IslamicQuiz(message, Poll);
                await checkAnswer(message);
            }

            // await message.reply(new Poll('Winter or Summer?', ['Winter', 'Summer']));

        } catch (error) {
            logger.error('Error processing message:', error);
        }
    });
}