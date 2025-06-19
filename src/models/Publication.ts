import db from '../config/database';
import type { User } from './User';
import {
    Model,
    DataTypes,
    BelongsToManyAddAssociationMixin,
    BelongsToManyGetAssociationsMixin,
    BelongsToManyRemoveAssociationMixin,
} from 'sequelize';

// --- Publication Model Attributes ---
export interface PublicationAttributes {
    id: string;
    userId: string;
    content: string;
    imageUrl?: string;
    category?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// --- Publication Model Class ---
export class Publication extends Model<PublicationAttributes> implements PublicationAttributes {
    public id!: string;
    public userId!: string;
    public content!: string;
    public imageUrl?: string;
    public category?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Associations
    public getLikers!: BelongsToManyGetAssociationsMixin<User>;
    public addLiker!: BelongsToManyAddAssociationMixin<User, string>;
    public removeLiker!: BelongsToManyRemoveAssociationMixin<User, string>;
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
        category: { // New: Category field
            type: DataTypes.STRING,
            allowNull: true, // Can be null if not classified or no relevant category
        }
    },
    {
        sequelize: db,
        modelName: 'Publication',
        tableName: 'publications',
    }
);
