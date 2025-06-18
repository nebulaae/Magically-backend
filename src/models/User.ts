import bcrypt from 'bcrypt';
import db from '../config/database';

import type { Publication } from './Publication';
import {
    Model,
    DataTypes,
    HasManyGetAssociationsMixin,
    BelongsToManyAddAssociationMixin,
    BelongsToManyRemoveAssociationMixin,
    BelongsToManyGetAssociationsMixin
} from 'sequelize';

// --- User Model Attributes ---
export interface UserAttributes {
    id: string;
    fullname: string;
    username: string;
    email: string;
    bio?: string;
    password: string;
    avatar?: string;
    interests?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

// --- User Model Class ---
export class User extends Model<UserAttributes> implements UserAttributes {
    public id!: string;
    public fullname!: string;
    public username!: string;
    public email!: string;
    public bio?: string;
    public password!: string;
    public avatar?: string;
    public interests?: string[];

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Instance method to compare passwords
    public async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }

    // --- Sequelize Mixins for Associations ---
    // These type definitions make TypeScript aware of the dynamic methods added by Sequelize.
    public getPublications!: HasManyGetAssociationsMixin<Publication>;
    public getFollowing!: BelongsToManyGetAssociationsMixin<User>;
    public addFollowing!: BelongsToManyAddAssociationMixin<User, string>;
    public removeFollowing!: BelongsToManyRemoveAssociationMixin<User, string>;
    public getFollowers!: BelongsToManyGetAssociationsMixin<User>;
}

// --- Initialize User Model ---
User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        fullname: {
            type: DataTypes.STRING(32),
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING(16),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        bio: {
            type: DataTypes.STRING(72),
            allowNull: true,
        },
        password: {
            type: DataTypes.STRING(60),
            allowNull: false,
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        interests: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
    },
    {
        sequelize: db,
        modelName: 'User',
        tableName: 'users',
        hooks: {
            beforeCreate: async (user: User) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user: User) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    }
);
