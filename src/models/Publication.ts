import db from '../config/database';          
import { DataTypes, Model } from 'sequelize';

// --- Publication Model Attributes ---
export interface PublicationAttributes {
    id: string;
    userId: string;
    content: string;
    imageUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// --- Publication Model Class ---
export class Publication extends Model<PublicationAttributes> implements PublicationAttributes {
    public id!: string;
    public userId!: string;
    public content!: string;
    public imageUrl?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// --- Initialize Publication Model ---
Publication.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users', // table name
                key: 'id',
            },
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize: db,
        modelName: 'Publication',
        tableName: 'publications',
    }
);