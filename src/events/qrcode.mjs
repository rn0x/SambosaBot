// /events/qrcode.mjs

import client from '../client.mjs'
import qrCode from 'qrcode-terminal';

export default function qrcode(client) {    
    client.on('qr', (qr) => {        
        // توليد الكود QR وقم بمسحه باستخدام هاتفك
        qrCode.generate(qr, { small: true });
    });
}