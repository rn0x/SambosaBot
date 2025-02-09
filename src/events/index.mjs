// /events/index.mjs
import logger from '../utils/logger.mjs'
import authenticated from "./authenticated.mjs";
import authFailure from "./authFailure.mjs";
import groupJoin from "./groupJoin.mjs";
import groupLeave from "./groupLeave.mjs";
import loadingScreen from "./loadingScreen.mjs";
import message from "./message.mjs";
import qrcode from "./qrcode.mjs";
import ready from "./ready.mjs";
import { config } from '../../config.mjs'

export function setupEvents(client, MessageMedia, Poll) {
    try {
        qrcode(client);          // تفعيل حدث QR Code
        loadingScreen(client);   // تفعيل حدث شاشة التحميل
        authenticated(client);   // تفعيل حدث المصادقة
        authFailure(client);     // تفعيل حدث فشل المصادقة
        ready(client);   // تفعيل حدث الجاهزية
        message(client, MessageMedia, Poll);      // تفعيل حدث الرسائل

        if (config.groupJoin) {
            groupJoin(client, MessageMedia);   // تفعيل حدث group_join
        }

        if (config.groupLeave) {
            groupLeave(client);   // تفعيل حدث group_leave
        }
    } catch (error) {
        logger.error("error setupEvents: ", error)
    }
}
