"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8888;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
if (process.env.DB_URL) {
    try {
        mongoose_1.default.connect(process.env.DB_URL);
        console.log('DB Connected...');
    }
    catch (error) {
        console.log(error);
    }
}
app.get('/', (req, res) => {
    res.send('Hello, world!');
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
