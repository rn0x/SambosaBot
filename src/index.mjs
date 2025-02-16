// /index.mjs

import { setupEvents } from "./events/index.mjs";
import client, { MessageMedia, Poll } from './client.mjs';
import { initGroupLockScheduler } from "./processors/scheduleGroupLockUnlock.mjs";
import { config } from "../config.mjs";


// إعداد جميع الأحداث الخاصة بالبوت
setupEvents(client, MessageMedia, Poll);


/*  
===============================
====== فتح القروب وغلقه ======
===============================
*/

// تعبير كرون لوقت القفل: "0 1 * * *" تعني الساعة 1:00 فجرا يوميًا
const lockCron = "0 1 * * *";
// تعبير كرون لوقت الفتح: "0 13 * * *" تعني الساعة 13:00 ظهرا يوميًا
const unlockCron = "0 13 * * *";
const groupLockScheduler = initGroupLockScheduler(client, MessageMedia);
groupLockScheduler.scheduleAllGroups(config.groupsToScheduleLockUnlock, lockCron, unlockCron);

await client.initialize(); // تهيئة العميل أولًا