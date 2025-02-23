// /events/message.mjs

import path from 'path';
import fs from 'fs-extra';
// import client from '../client.mjs'
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
import { generatePhoneNumberSticker } from '../processors/stickers/generatePhoneNumberSticker.mjs';
import StickerPrayerTimes from '../processors/stickers/StickerPrayerTimes.mjs';
import DateToSticker from '../processors/stickers/DateToSticker.mjs';
import SignatureStickers from '../processors/stickers/signatureStickers.mjs';
import { videoToStickerWithText } from '../processors/stickers/videoToStickerWithText.mjs';
import { applyAudioEffect } from '../processors/applyAudioEffect.mjs';
import { sendHijriCalendar } from '../processors/sendHijriCalendar.mjs';
import { autoKick } from '../processors/messages/autoKick.mjs';
import { searchAndConvertToSticker } from '../processors/stickers/searchAndConvertToSticker.mjs';
import { searchAndConvertToStickerGif } from '../processors/stickers/searchAndConvertToStickerGif.mjs';

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
                sender: message.author,
            };

            // التعامل مع السبام
            await handleSpam(message, messageMeta);

            // نلقائي يعمل في قروبات معينة فقط
            if (messageMeta.isGroup) {
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
            await generatePhoneNumberSticker(message, MessageMedia, messageMeta);
            await StickerPrayerTimes(message, MessageMedia);
            await DateToSticker(message, MessageMedia);
            await SignatureStickers(message, MessageMedia);
            await videoToStickerWithText(message, MessageMedia, messageMeta);
            await sendMenu(message, messageMeta);
            await sendHijriCalendar(message, MessageMedia);
            await applyAudioEffect(message, MessageMedia, messageMeta);
            await searchAndConvertToSticker(message, MessageMedia, messageMeta);
            await searchAndConvertToStickerGif(message, MessageMedia, messageMeta);
            await IslamicQuiz(message, Poll);
            await checkAnswer(message);


            await autoKick(message, messageMeta, getChat); // حذف الروابط والمرسل

            // await message.reply(new Poll('Winter or Summer?', ['Winter', 'Summer']));

        } catch (error) {
            logger.error('Error processing message:', error);
        }
    });
}