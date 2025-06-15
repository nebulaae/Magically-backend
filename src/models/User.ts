import db from '../config/database';
import bcrypt from 'bcrypt';
import { DataTypes, Model } from 'sequelize';

// --- User Model ---
export interface UserAttributes {
    id: string;
    fullname: string;
    username: string;
    email: string;
    bio?: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
    public id!: string;
    public fullname!: string;
    public username!: string;
    public email!: string;
    public bio?: string;
    public password!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }
}

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
            type: DataTypes.STRING(60), // bcrypt hash length
            allowNull: false,
        },
    },
    {
        sequelize: db,
        modelName: 'User',
        tableName: 'users',
        hooks: {
            beforeCreate: async (user: User) => {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
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

export const user = { User };
export { db };