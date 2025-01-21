// /events/groupLeave.mjs

import client from '../client.mjs';

export default function groupLeave(client) {
    client.on('group_leave', async (e) => {
        console.log(`User ${e.who} left the group ${e.chat.name}`);
    });
}
