// /events/groupJoin.mjs

import client from '../client.mjs';

export default function groupJoin(client) {
    client.on('group_join', async (e) => {
        console.log(`User ${e.who} joined the group ${e.chat.name}`);
    });
}