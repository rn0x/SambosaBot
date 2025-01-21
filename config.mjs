import dotenv from 'dotenv';
dotenv.config();
import path from "node:path";
export const root = path.resolve(process.cwd()); // project root directory (./)

export const config = {

  /* Config Database */
  DatabasePath: process.env.DATABASE_PATH || path.join(root, "src", "database", "database.sqlite"),
  defaultAuthor: process.env.DEFAULT_AUTHOR,

  /* Paths */
  paths: {
    root: root,
    logs: path.join(root, "src", "logs"),
    temp: path.join(root, "temp"),
  },

  allowedGroups: [
    "1234567890-1234567890@g.us",
    "9876543210-9876543210@g.us"
  ],
};