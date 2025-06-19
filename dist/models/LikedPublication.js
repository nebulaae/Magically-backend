"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikedPublication = void 0;
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
class LikedPublication extends sequelize_1.Model {
}
exports.LikedPublication = LikedPublication;
LikedPublication.init({
    userId: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    publicationId: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        references: {
            model: 'publications',
            key: 'id',
        },
    },
}, {
    sequelize: database_1.default,
    modelName: 'LikedPublication',
    tableName: 'liked_publications',
    timestamps: false,
});
//# sourceMappingURL=LikedPublication.js.map