import dotenv from 'dotenv';
dotenv.config();
import path from "node:path";
export const root = path.resolve(process.cwd()); // project root directory (./)

export const config = {

  adminPhoneNumber: process.env.ADMIN_PHONE_NUMBER,
  defaultAuthor: process.env.DEFAULT_AUTHOR,
  defaultTitle: process.env.DEFAULT_TITLE,

  /* Config Database */
  DatabasePath: process.env.DATABASE_PATH || path.join(root, "src", "database", "database.sqlite"),

  /* Paths */
  paths: {
    root: root,
    logs: path.join(root, "src", "logs"),
  },
};