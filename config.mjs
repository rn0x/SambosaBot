import dotenv from 'dotenv';
dotenv.config();
import path from "node:path";
export const root = path.resolve(process.cwd()); // project root directory (./)

export const config = {

  /* Config Database */
  DatabasePath: process.env.DATABASE_PATH || path.join(root, "src", "database", "database.sqlite"),
  stickerName: process.env.DEFAULT_AUTHOR,

  /* Paths */
  paths: {
    root: root,
    logs: path.join(root, "src", "logs"),
    temp: path.join(root, "temp"),
  },

  allowedGroups: [
    "120363388964573265@g.us",
    "966500552603-1573502799@g.us",
    "966551222126-1570743960@g.us",
    "966500552603-1541354263@g.us",
    "966500552603-1584995003@g.us",
    "120363387170963887@g.us",
  ],
};