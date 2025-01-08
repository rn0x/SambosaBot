// src/handlers/messageHandler.mjs
export async function handleMessage(client, message, sequelize) {
    const userId = message.from;
    const user = await sequelize.models.User.findOrCreate({ where: { id: userId } });

    // Add logic for routing message to the appropriate scene or handler
}
