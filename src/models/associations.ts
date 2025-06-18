import { User } from './User';
import { Publication } from './Publication';
import { Subscription } from './Subscription';

export const setupAssociations = () => {
    // User -> Publication (One-to-Many)
    // A user can have many publications.
    User.hasMany(Publication, {
        foreignKey: 'userId',
        as: 'publications',
    });
    Publication.belongsTo(User, {
        foreignKey: 'userId',
        as: 'author',
    });

    User.belongsToMany(User, {
        as: 'Followers',
        through: Subscription,
        foreignKey: 'followingId',
        otherKey: 'followerId',
    });

    User.belongsToMany(User, {
        as: 'Following',
        through: Subscription,
        foreignKey: 'followerId',
        otherKey: 'followingId',
    });

    console.log('Database associations have been set up.');
};
