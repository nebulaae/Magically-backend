"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAssociations = void 0;
const User_1 = require("./User");
const Comment_1 = require("./Comment");
const Publication_1 = require("./Publication");
const Subscription_1 = require("./Subscription");
const LikedComment_1 = require("./LikedComment");
const LikedPublication_1 = require("./LikedPublication");
const setupAssociations = () => {
    // User -> Publication (One-to-Many)
    User_1.User.hasMany(Publication_1.Publication, {
        foreignKey: 'userId',
        as: 'publications',
        onDelete: 'CASCADE'
    });
    Publication_1.Publication.belongsTo(User_1.User, {
        foreignKey: 'userId',
        as: 'author',
    });
    // User <-> User (Many-to-Many through Subscription for followers/following)
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
    // User <-> Publication (Many-to-Many through LikedPublication for likes)
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
    // --- NEW: Comment Associations ---
    // User -> Comment (One-to-Many)
    User_1.User.hasMany(Comment_1.Comment, {
        foreignKey: 'userId',
        as: 'comments',
        onDelete: 'CASCADE'
    });
    Comment_1.Comment.belongsTo(User_1.User, {
        foreignKey: 'userId',
        as: 'author',
    });
    // Publication -> Comment (One-to-Many)
    Publication_1.Publication.hasMany(Comment_1.Comment, {
        foreignKey: 'publicationId',
        as: 'comments',
        onDelete: 'CASCADE'
    });
    Comment_1.Comment.belongsTo(Publication_1.Publication, {
        foreignKey: 'publicationId',
        as: 'publication',
    });
    // Comment -> Comment (Self-referencing for replies)
    Comment_1.Comment.hasMany(Comment_1.Comment, {
        foreignKey: 'parentId',
        as: 'replies',
        onDelete: 'CASCADE'
    });
    Comment_1.Comment.belongsTo(Comment_1.Comment, {
        foreignKey: 'parentId',
        as: 'parent',
    });
    // User <-> Comment (Many-to-Many for likes on comments)
    User_1.User.belongsToMany(Comment_1.Comment, {
        as: 'likedComments',
        through: LikedComment_1.LikedComment,
        foreignKey: 'userId',
        otherKey: 'commentId',
    });
    Comment_1.Comment.belongsToMany(User_1.User, {
        as: 'likers',
        through: LikedComment_1.LikedComment,
        foreignKey: 'commentId',
        otherKey: 'userId',
    });
    console.log('Database associations have been set up.');
};
exports.setupAssociations = setupAssociations;
//# sourceMappingURL=associations.js.map