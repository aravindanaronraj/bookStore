"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const source = path_1.default.resolve(__dirname, "../../src/templates/emails");
const destination = path_1.default.resolve(__dirname, "../templates/emails");
fs_1.default.mkdirSync(destination, { recursive: true });
fs_1.default.cpSync(source, destination, { recursive: true });
console.log(`Copied email templates to ${destination}`);
