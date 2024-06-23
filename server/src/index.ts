import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8888;

app.use(cors());
app.use(express.json());

if (process.env.DB_URL) {
    try {
        mongoose.connect(process.env.DB_URL);
        console.log('DB Connected...');
    } catch (error) {
        console.log(error);
    }
}


app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
