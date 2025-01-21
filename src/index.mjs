// /index.mjs

import { setupEvents } from "./events/index.mjs";
import client from './client.mjs'


// إعداد جميع الأحداث الخاصة بالبوت
setupEvents(client);
await client.initialize();  // تهيئة العميل أولًا