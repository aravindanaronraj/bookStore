import fs from "fs";
import path from "path";

const source = path.resolve(__dirname, "../../src/templates/emails");
const destination = path.resolve(__dirname, "../templates/emails");

fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });
console.log(`Copied email templates to ${destination}`);
