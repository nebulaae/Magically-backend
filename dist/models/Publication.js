"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Publication = void 0;
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
// --- Publication Model Class ---
class Publication extends sequelize_1.Model {
}
exports.Publication = Publication;
// --- Initialize Publication Model ---
Publication.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users', // table name
            key: 'id',
        },
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    imageUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true, // Can be null if not classified or no relevant category
    }
}, {
    sequelize: database_1.default,
    modelName: 'Publication',
    tableName: 'publications',
});
//# sourceMappingURL=Publication.js.map