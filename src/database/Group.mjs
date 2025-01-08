import { sequelize, DataTypes } from './db.mjs';

const Group = sequelize.define('Group', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,  // تعيين id كمفتاح أساسي
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    allowedContent: {
        type: DataTypes.JSON,
        defaultValue: ['image', 'video', 'gif', 'png'],
    },
  });
  
  export default Group;