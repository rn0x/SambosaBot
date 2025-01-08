import User from './User.mjs';
import Group from './Group.mjs';

// ترابط المستخدم والقروبات
User.hasMany(Group, { foreignKey: 'userId', as: 'groups' });
Group.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Group };