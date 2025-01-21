// /events/ready.mjs
import client from '../client.mjs'

export default function ready(client) {
    client.on('ready', async () => {
        console.log('WhatsApp bot is ready!');
        // الحصول على جميع القروبات
        const chats = await client.getChats();

        // تصفية القروبات فقط
        const groups = chats.filter(chat => chat.id._serialized.includes('@g.us'));

        // طباعة معرف القروب لكل قروب
        groups.forEach(group => {
            console.log(`Group Name: ${group.name}, Group ID: ${group.id._serialized}`);
        });
    });
}