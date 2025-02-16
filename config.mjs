import dotenv from 'dotenv';
dotenv.config();
import path from "node:path";
export const root = path.resolve(process.cwd()); // project root directory (./)

export const config = {

  /* Config Database */
  DatabasePath: process.env.DATABASE_PATH || path.join(root, "src", "database", "database.sqlite"),


  /* Config bot */
  PuppeteerPath: process.env.PUPPETEER_EXECUTABLE_PATH,
  stickerName: process.env.DEFAULT_AUTHOR,
  groupJoin: process.env.GROUP_JOIN === 'true',
  groupLeave: process.env.GROUP_LEAVE === 'true',
  toStickerAuto: process.env.STICKER_AUTO === 'true',
  lockCron: process.env.LOCK_CRON || "0 1 * * *",
  unlockCron: process.env.UNLOCK_CRON || "0 13 * * *",

  /* Paths */
  paths: {
    root: root,
    public: path.join(root, "src", "public"),
    logs: path.join(root, "logs"),
    temp: path.join(root, "temp"),
  },

  /* القروبات الي لا يعمل فيها بعض الأوامر او يعمل فيها */
  allowedGroups: [
    "120363388964573265@g.us",
    "966500552603-1573502799@g.us",
    "966551222126-1570743960@g.us",
    "966500552603-1541354263@g.us",
    "966500552603-1584995003@g.us",
    "120363387170963887@g.us",
    "966500552603-1583377816@g.us",
  ],
  /* قائمة القروبات التي تريد جدولة فتحها وقفلها */
  groupsToScheduleLockUnlock: [
    '120363388964573265@g.us',
    '120363372703871570@g.us',
  ]
};