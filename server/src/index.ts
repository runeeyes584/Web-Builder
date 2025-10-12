import bodyParser from "body-parser";
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import userRouter from './routes/Users.route';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(bodyParser.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  },
}));

// Routes
app.use('/api/users', userRouter);
app.use('/health', healthRouter);

app.get('/', (_req: any, res: { json: (arg0: { ok: boolean; service: string; }) => void; }) => {
    res.json({ ok: true, service: 'web-builder-server' });
});

// Error handling (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
});
