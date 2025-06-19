"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAssociations = void 0;
const User_1 = require("./User");
const Publication_1 = require("./Publication");
const Subscription_1 = require("./Subscription");
const LikedPublication_1 = require("./LikedPublication"); // New: Import LikedPublication
const setupAssociations = () => {
    // User -> Publication (One-to-Many)
    // A user can have many publications.
    User_1.User.hasMany(Publication_1.Publication, {
        foreignKey: 'userId',
        as: 'publications',
    });
    Publication_1.Publication.belongsTo(User_1.User, {
        foreignKey: 'userId',
        as: 'author',
    });
    // User <-> User (Many-to-Many through Subscription)
    User_1.User.belongsToMany(User_1.User, {
        as: 'Followers',
        through: Subscription_1.Subscription,
        foreignKey: 'followingId',
        otherKey: 'followerId',
    });
    User_1.User.belongsToMany(User_1.User, {
        as: 'Following',
        through: Subscription_1.Subscription,
        foreignKey: 'followerId',
        otherKey: 'followingId',
    });
    // New: User <-> Publication (Many-to-Many through LikedPublication)
    // A user can like many publications, and a publication can be liked by many users.
    User_1.User.belongsToMany(Publication_1.Publication, {
        as: 'likedPublications',
        through: LikedPublication_1.LikedPublication,
        foreignKey: 'userId',
        otherKey: 'publicationId',
    });
    Publication_1.Publication.belongsToMany(User_1.User, {
        as: 'likers',
        through: LikedPublication_1.LikedPublication,
        foreignKey: 'publicationId',
        otherKey: 'userId',
    });
    console.log('Database associations have been set up.');
};
exports.setupAssociations = setupAssociations;
//# sourceMappingURL=associations.js.map