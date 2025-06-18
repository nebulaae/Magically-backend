"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
// --- Subscription Model Class ---
class Subscription extends sequelize_1.Model {
}
exports.Subscription = Subscription;
// --- Initialize Subscription Model ---
Subscription.init({
    followerId: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    followingId: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    sequelize: database_1.default,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: false, // No createdAt/updatedAt for a join table
});
//# sourceMappingURL=Subscription.js.map