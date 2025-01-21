// /events/ready.mjs
import client from '../client.mjs'

export default function ready(client) {
    client.on('ready', () => {
        console.log('WhatsApp bot is ready!');
    });
}
