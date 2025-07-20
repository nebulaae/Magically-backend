"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const database_1 = __importDefault(require("./config/database"));
// Import model associations setup
const associations_1 = require("./models/associations");
// import classifiers
const classificationService_1 = require("./services/classificationService");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const publication_1 = __importDefault(require("./routes/publication"));
const generation_1 = __importDefault(require("./routes/generation"));
dotenv_1.default.config();
// Initialize express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Serve static files from the 'public' directory
// This is crucial for making avatars and publication images accessible via URL
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/publications', publication_1.default);
app.use('/api/users', user_1.default);
app.use('/api/ai', generation_1.default);
// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
// Initialize database and start server
const startServer = async () => {
    try {
        // Setup model associations
        (0, associations_1.setupAssociations)();
        // Init classifiers
        (0, classificationService_1.initTextClassifier)();
        (0, classificationService_1.initImageClassifier)();
        await database_1.default.sync({ alter: true });
        console.log('Database synchronized');
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
    }
};
startServer();
//# sourceMappingURL=index.js.map