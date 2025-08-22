"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./api/v1/routes");
const env_1 = require("./utils/env");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '2mb' }));
app.use((0, morgan_1.default)('dev'));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
(0, routes_1.registerV1Routes)(app);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const PORT = Number((0, env_1.getEnv)('PORT', '8000'));
app.listen(PORT, '0.0.0.0', () => {
    console.log(`ATS Scoring API listening on port ${PORT}`);
});
