import { User } from './User';
import { Comment } from './Comment';
import { Publication } from './Publication';
import { Subscription } from './Subscription';
import { LikedComment } from './LikedComment';
import { LikedPublication } from './LikedPublication';

export const setupAssociations = () => {
    // User -> Publication (One-to-Many)
    User.hasMany(Publication, {
        foreignKey: 'userId',
        as: 'publications',
        onDelete: 'CASCADE'
    });
    Publication.belongsTo(User, {
        foreignKey: 'userId',
        as: 'author',
    });

    // User <-> User (Many-to-Many through Subscription for followers/following)
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

    // User <-> Publication (Many-to-Many through LikedPublication for likes)
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

    // --- NEW: Comment Associations ---

    // User -> Comment (One-to-Many)
    User.hasMany(Comment, {
        foreignKey: 'userId',
        as: 'comments',
        onDelete: 'CASCADE'
    });
    Comment.belongsTo(User, {
        foreignKey: 'userId',
        as: 'author',
    });

    // Publication -> Comment (One-to-Many)
    Publication.hasMany(Comment, {
        foreignKey: 'publicationId',
        as: 'comments',
        onDelete: 'CASCADE'
    });
    Comment.belongsTo(Publication, {
        foreignKey: 'publicationId',
        as: 'publication',
    });

    // Comment -> Comment (Self-referencing for replies)
    Comment.hasMany(Comment, {
        foreignKey: 'parentId',
        as: 'replies',
        onDelete: 'CASCADE'
    });
    Comment.belongsTo(Comment, {
        foreignKey: 'parentId',
        as: 'parent',
    });

    // User <-> Comment (Many-to-Many for likes on comments)
    User.belongsToMany(Comment, {
        as: 'likedComments',
        through: LikedComment,
        foreignKey: 'userId',
        otherKey: 'commentId',
    });
    Comment.belongsToMany(User, {
        as: 'likers',
        through: LikedComment,
        foreignKey: 'commentId',
        otherKey: 'userId',
    });


    console.log('Database associations have been set up.');
};
