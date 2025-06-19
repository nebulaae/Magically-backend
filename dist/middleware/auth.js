"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const User_1 = require("../models/User");
const authService_1 = require("../services/authService");
const auth = async (req, res, next) => {
    var _a;
    try {
        const token = req.cookies.token || ((_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', ''));
        if (!token) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const decoded = (0, authService_1.verifyToken)(token);
        if (!decoded) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
        const user = await User_1.User.findByPk(decoded.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
};
exports.auth = auth;
//# sourceMappingURL=auth.js.map