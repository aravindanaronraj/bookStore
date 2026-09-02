"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const seedTamilBooks_1 = require("./scripts/seedTamilBooks");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await (0, db_1.default)();
    await (0, seedTamilBooks_1.seedAllDefaults)();
    app_1.default.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
};
startServer();
