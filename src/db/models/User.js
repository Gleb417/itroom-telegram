import { DataTypes } from 'sequelize'
import sequelize from './index.js' // Предполагается, что у вас есть файл подключения к базе данных

const User = sequelize.define(
	'User',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		telegram_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
		},
		github_username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		github_token: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'users', // Имя таблицы
		timestamps: false, // Отключаем автоматическое добавление полей `createdAt` и `updatedAt`
		underscored: true, // Используем snake_case для названий колонок
		indexes: [
			{ fields: ['telegram_id'], unique: true },
			{ fields: ['github_token'], unique: true },
		],
	}
)

// Обновление поля updated_at при каждом изменении записи
User.beforeUpdate(user => {
	user.updated_at = new Date()
})

export default User
