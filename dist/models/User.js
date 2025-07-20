"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
// --- User Model Class ---
class User extends sequelize_1.Model {
    async comparePassword(candidatePassword) {
        if (!this.password)
            return false;
        return bcrypt_1.default.compare(candidatePassword, this.password);
    }
}
exports.User = User;
// --- Initialize User Model ---
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    fullname: {
        type: sequelize_1.DataTypes.STRING(32),
        allowNull: true,
    },
    username: {
        type: sequelize_1.DataTypes.STRING(16),
        allowNull: true,
        unique: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    bio: {
        type: sequelize_1.DataTypes.STRING(72),
        allowNull: true,
    },
    password: {
        type: sequelize_1.DataTypes.STRING(60),
        allowNull: true,
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    interests: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
    },
    verified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    otp: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    otpExpires: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    passwordResetToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    passwordResetTokenExpires: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    gallery: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
    },
}, {
    sequelize: database_1.default,
    modelName: 'User',
    tableName: 'users',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt_1.default.genSalt(10);
                user.password = await bcrypt_1.default.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password') && user.password) {
                const salt = await bcrypt_1.default.genSalt(10);
                user.password = await bcrypt_1.default.hash(user.password, salt);
            }
        },
    },
});
//# sourceMappingURL=User.js.map