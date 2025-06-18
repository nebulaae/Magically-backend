"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAssociations = void 0;
const User_1 = require("./User");
const Publication_1 = require("./Publication");
const Subscription_1 = require("./Subscription");
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
    console.log('Database associations have been set up.');
};
exports.setupAssociations = setupAssociations;
//# sourceMappingURL=associations.js.map