// /index.mjs

import { setupEvents } from "./events/index.mjs";
import client, { MessageMedia, Poll } from './client.mjs';



// إعداد جميع الأحداث الخاصة بالبوت
setupEvents(client, MessageMedia, Poll);
await client.initialize();  // تهيئة العميل أولًا