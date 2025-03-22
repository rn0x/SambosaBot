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

const groupLockScheduler = initGroupLockScheduler(client, MessageMedia);
groupLockScheduler.scheduleAllGroups(config.groupsToScheduleLockUnlock, config.lockCron, config.unlockCron, 30000);

await client.initialize(); // تهيئة العميل أولًا