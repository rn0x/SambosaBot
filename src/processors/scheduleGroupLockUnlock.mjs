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
  /**
   * دالة مساعدة لتحويل الوقت إلى نظام الـ12 ساعة.
   * @param {Date} date - التاريخ الحالي.
   * @returns {string} - الوقت بصيغة "hh:mm AM/PM".
   */
  function formatTime12Hour(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  }

  /**
   * تحديث حالة القروب (قفل أو فتح) عن طريق تفعيل أو إلغاء وضع "الرسائل للمشرفين فقط".
   * @param {string} groupId - معرف القروب.
   * @param {boolean} lock - true لقفل القروب، false لفتحه.
   */
  async function updateGroupLockState(groupId, lock) {
    try {
      const chat = await client.getChatById(groupId);
      if (!chat.isGroup) {
        logger.info(`${groupId} ليس قروب.`);
        return;
      }
      // التأكد من أن البوت مشرف في القروب
      const botId = client.info.wid._serialized;
      const botParticipant = chat.participants.find(
        (p) => p.id._serialized === botId
      );
      if (!botParticipant || !botParticipant.isAdmin) {
        logger.info(`البوت ليس مشرفًا في القروب ${groupId}.`);
        return;
      }
      // تغيير حالة القروب: true = قفل (المشرفين فقط)، false = فتح
      await chat.setMessagesAdminsOnly(lock);
      logger.info(`تم ${lock ? 'قفل' : 'فتح'} القروب ${groupId}.`);
    } catch (error) {
      logger.error(`خطأ أثناء تحديث حالة القروب ${groupId}:`, error);
    }
  }

  /**
   * عند فتح القروب، تُرسل هذه الدالة فيديو ونص معين للقروب.
   * تأكد من تعديل مسار الفيديو ونوعه حسب الحاجة.
   * @param {string} groupId - معرف القروب.
   */
  async function sendUnlockMessage(groupId) {
    try {
      const chat = await client.getChatById(groupId);
      // تعديل مسار الفيديو حسب ملف الفتح (unlock)
      const videoPath = path.join(config.paths.public, 'videos', 'unlock_video.mp4'); // عدل هذا المسار حسب احتياجك
      const videoBuffer = await fs.readFile(videoPath);
      const videoBase64 = videoBuffer.toString('base64');
      const videoMedia = new MessageMedia('video/mp4', videoBase64, 'unlock_video.mp4');
      const currentTime = formatTime12Hour(new Date());
      const stickerPath = path.join(config.paths.public, 'images', 'lock_group.png');
      const stickerBuffer = await fs.readFile(stickerPath);
      const stickerBase64 = stickerBuffer.toString('base64');
      const stickerMedia = new MessageMedia('image/png', stickerBase64, 'lock_group.png');
      let textMessage = `*تنبيه* 📢\n\n`;
      textMessage += "تم *فتح* القروب الآن،\n"
      textMessage += "ونسأل الله أن يكون يومكم مليئًا بالخير والبركة،\n"
      textMessage += "حيّاكم الله جميعاً، ومرحبًا بتفاعلكم الطيب. 🌿🤍"
      await chat.sendMessage(videoMedia, { caption: textMessage });
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

  /**
   * عند قفل القروب، تُرسل هذه الدالة فيديو ونص معين للقروب.
   * تأكد من تعديل مسار الفيديو ونوعه حسب الحاجة.
   * @param {string} groupId - معرف القروب.
   */
  async function sendLockMessage(groupId) {
    try {
      const chat = await client.getChatById(groupId);
      // تعديل مسار الفيديو حسب ملف القفل (lock)
      const videoPath = path.join(config.paths.public, 'videos', 'lock_video.mp4');
      const videoBuffer = await fs.readFile(videoPath);
      const videoBase64 = videoBuffer.toString('base64');
      const videoMedia = new MessageMedia('video/mp4', videoBase64, 'lock_video.mp4');
      const stickerPath = path.join(config.paths.public, 'images', 'lock_group.png');
      const stickerBuffer = await fs.readFile(stickerPath);
      const stickerBase64 = stickerBuffer.toString('base64');
      const stickerMedia = new MessageMedia('image/png', stickerBase64, 'lock_group.png');

      let textMessage = `*تنبيه* 📢\n\n`;
      textMessage += "لقد حان وقت *إغلاق* القروب،\n"
      textMessage += "ويتجدد لقاؤنا معكم بإذن الله تعالی غداً،\n"
      textMessage += "غفر الله لنا ولكم، ودمتم في حفظه ورعايته. 🤍"
      await chat.sendMessage(videoMedia, { caption: textMessage });
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
   * جدولة قفل وفتح قروب معين باستخدام node-schedule.
   * @param {string} groupId - معرف القروب.
   * @param {string} lockCron - تعبير كرون لوقت القفل (مثلاً "0 1 * * *" يعني الساعة 1:00 صباحًا يوميًا).
   * @param {string} unlockCron - تعبير كرون لوقت الفتح (مثلاً "0 10 * * *" يعني الساعة 10:00 صباحًا يوميًا).
   */
  function scheduleGroupLockUnlock(groupId, lockCron, unlockCron) {
    // جدولة القفل مع إرسال فيديو ونص
    schedule.scheduleJob(lockCron, async () => {
      await updateGroupLockState(groupId, true);
      await sendLockMessage(groupId);
    });
    // جدولة الفتح مع إرسال فيديو ونص
    schedule.scheduleJob(unlockCron, async () => {
      await updateGroupLockState(groupId, false);
      await sendUnlockMessage(groupId);
    });
  }

  /**
   * جدولة جميع القروبات الموجودة في القائمة وفقًا لتعبيرات كرون الخاصة بالقفل والفتح.
   * @param {string[]} groups - قائمة معرفات القروبات.
   * @param {string} lockCron - تعبير كرون لوقت القفل.
   * @param {string} unlockCron - تعبير كرون لوقت الفتح.
   */
  function scheduleAllGroups(groups, lockCron, unlockCron) {
    groups.forEach((groupId) => {
      scheduleGroupLockUnlock(groupId, lockCron, unlockCron);
    });
  }

  return { scheduleAllGroups };
}
