// /processors/scheduleGroupLockUnlock.mjs

import schedule from 'node-schedule';
import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger.mjs';
import { config } from '../../config.mjs';

/**
 * دالة تهيئة جدولة قفل وفتح القروبات.
 * @param {object} client - كائن العميل الخاص بـ whatsapp-web.js.
 * @param {object} MessageMedia - الكلاس الخاص بالوسائط من whatsapp-web.js.
 * @returns {object} - يحتوي على دالة scheduleAllGroups لجدولة القروبات.
 */
export function initGroupLockScheduler(client, MessageMedia) {

  async function updateGroupLockState(groupId, lock) {
    try {
      const chat = await client.getChatById(groupId);
      if (!chat.isGroup) {
        logger.info(`${groupId} ليس قروبًا.`);
        return;
      }

      const botId = client.info.wid._serialized;
      const botParticipant = chat.participants.find(
        (p) => p.id._serialized === botId
      );

      if (!botParticipant || !botParticipant.isAdmin) {
        logger.info(`البوت ليس مشرفًا في القروب ${groupId}.`);
        return;
      }

      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          await chat.setMessagesAdminsOnly(lock);
          logger.info(`تم ${lock ? 'قفل' : 'فتح'} القروب ${groupId}.`);
          return;
        } catch (error) {
          attempts++;
          logger.warn(`محاولة ${attempts} فشلت لتغيير حالة القروب ${groupId}.`, error);
          if (attempts < maxAttempts) await new Promise(res => setTimeout(res, 2000));
        }
      }

      logger.error(`فشل تغيير حالة القروب ${groupId} بعد ${maxAttempts} محاولات.`);
    } catch (error) {
      logger.error(`خطأ أثناء تحديث حالة القروب ${groupId}:`, error);
    }
  }

  async function sendUnlockMessage(groupId) {
    try {
      const chat = await client.getChatById(groupId);
      const stickerPath = path.join(config.paths.public, 'images', 'unlock_group.png');
      const stickerBuffer = await fs.readFile(stickerPath);
      const stickerBase64 = stickerBuffer.toString('base64');
      const stickerMedia = new MessageMedia('image/png', stickerBase64, 'unlock_group.png');

      let textMessage = `*تنبيه* 📢\n\n`;
      textMessage += "تم *فتح* القروب الآن،\n";
      textMessage += "ونسأل الله أن يكون يومكم مليئًا بالخير والبركة،\n";
      textMessage += "حيّاكم الله جميعاً، ومرحبًا بتفاعلكم الطيب. 🌿🤍\n\n";
      textMessage += "📌 ملاحظة: سيتم *إغلاق* القروب في تمام الساعة 5 فجرًا.";


      await chat.sendMessage(textMessage);
      await chat.sendMessage(stickerMedia, {
        sendMediaAsSticker: true,
        stickerAuthor: 'تنبيه',
        stickerName: 'تم فتح القروب ✅'
      });

      logger.info(`تم إرسال رسالة فتح القروب في ${groupId}.`);
    } catch (error) {
      logger.error(`خطأ أثناء إرسال رسالة فتح القروب في ${groupId}:`, error);
    }
  }

  async function sendLockMessage(groupId) {
    try {
      const chat = await client.getChatById(groupId);
      const stickerPath = path.join(config.paths.public, 'images', 'lock_group.png');
      const stickerBuffer = await fs.readFile(stickerPath);
      const stickerBase64 = stickerBuffer.toString('base64');
      const stickerMedia = new MessageMedia('image/png', stickerBase64, 'lock_group.png');

      let textMessage = `*تنبيه* 📢\n\n`;
      textMessage += "لقد حان وقت *إغلاق* القروب،\n";
      textMessage += "ويتجدد لقاؤنا معكم بإذن الله تعالى غداً *في تمام الساعة 1 ظهرًا*.\n";
      textMessage += "غفر الله لنا ولكم، ودمتم في حفظه ورعايته. 🤍";


      await chat.sendMessage(textMessage);
      await chat.sendMessage(stickerMedia, {
        sendMediaAsSticker: true,
        stickerAuthor: 'تنبيه',
        stickerName: 'تم إغلاق القروب ⚠️'
      });

      logger.info(`تم إرسال رسالة قفل القروب في ${groupId}.`);
    } catch (error) {
      logger.error(`خطأ أثناء إرسال رسالة قفل القروب في ${groupId}:`, error);
    }
  }

  /**
   * جدولة جميع القروبات مع تأخير أثناء القفل والفتح.
   * @param {string[]} groups - قائمة معرفات القروبات.
   * @param {string} lockCron - تعبير كرون لوقت القفل.
   * @param {string} unlockCron - تعبير كرون لوقت الفتح.
   * @param {number} delay - التأخير بين كل قروب (بالمللي ثانية، الافتراضي 30 ثانية).
   */
  function scheduleAllGroups(groups, lockCron, unlockCron, delay = 30000) {
    schedule.scheduleJob(lockCron, async () => {
      logger.info(`بدأ تنفيذ إغلاق القروبات (${groups.length} قروب) بفارق زمني ${delay / 1000} ثانية لكل قروب.`);
      for (let i = 0; i < groups.length; i++) {
        setTimeout(async () => {
          await updateGroupLockState(groups[i], true);
          await sendLockMessage(groups[i]);
        }, i * delay);
      }
    });

    schedule.scheduleJob(unlockCron, async () => {
      logger.info(`بدأ تنفيذ فتح القروبات (${groups.length} قروب) بفارق زمني ${delay / 1000} ثانية لكل قروب.`);
      for (let i = 0; i < groups.length; i++) {
        setTimeout(async () => {
          await updateGroupLockState(groups[i], false);
          await sendUnlockMessage(groups[i]);
        }, i * delay);
      }
    });
  }

  return { scheduleAllGroups };
}
