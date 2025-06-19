import { User } from './User';
import { Publication } from './Publication';
import { Subscription } from './Subscription';
import { LikedPublication } from './LikedPublication'; // New: Import LikedPublication

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

    // User <-> User (Many-to-Many through Subscription)
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

    // New: User <-> Publication (Many-to-Many through LikedPublication)
    // A user can like many publications, and a publication can be liked by many users.
    User.belongsToMany(Publication, {
        as: 'likedPublications',
        through: LikedPublication,
        foreignKey: 'userId',
        otherKey: 'publicationId',
    });
    Publication.belongsToMany(User, {
        as: 'likers',
        through: LikedPublication,
        foreignKey: 'publicationId',
        otherKey: 'userId',
    });

    console.log('Database associations have been set up.');
};