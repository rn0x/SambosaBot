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

export function setupEvents(client, MessageMedia, Poll) {
    try {
        qrcode(client);          // تفعيل حدث QR Code
        loadingScreen(client);   // تفعيل حدث شاشة التحميل
        authenticated(client);   // تفعيل حدث المصادقة
        authFailure(client);     // تفعيل حدث فشل المصادقة
        ready(client);   // تفعيل حدث الجاهزية
        groupJoin(client, MessageMedia);   // تفعيل حدث group_join
        // groupLeave(client);   // تفعيل حدث group_leave
        message(client, MessageMedia, Poll);      // تفعيل حدث الرسائل
    } catch (error) {
        logger.error("error setupEvents: ", error)
    }
}
