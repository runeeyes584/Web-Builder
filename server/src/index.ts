import bodyParser from "body-parser";
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import collaborationRouter from './routes/Collaboration.route';
import cloudinaryRouter from './routes/Cloudinary.route';
import editHistoryRouter from './routes/EditHistory.route';
import { healthRouter } from './routes/health';
import pageRouter from './routes/Page.route';
import projectRouter from './routes/Project.route';
import userRouter from './routes/Users.route';
import { CollaborationSocket } from './socket-server';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors());
// Increase limit to handle large projects with images and multiple components
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

app.use(bodyParser.json({
  limit: '50mb', // Increase limit for large project data
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  },
}));

// Routes
app.use('/api/users', userRouter);
app.use('/api/projects', projectRouter);
app.use('/api/pages', pageRouter);
app.use('/api/history', editHistoryRouter);
app.use('/api/collaboration', collaborationRouter);
app.use('/api/cloudinary', cloudinaryRouter);
app.use('/health', healthRouter);

app.get('/', (_req: any, res: { json: (arg0: { ok: boolean; service: string; }) => void; }) => {
    res.json({ ok: true, service: 'web-builder-server' });
});

// Error handling (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.IO collaboration
const collaborationSocket = new CollaborationSocket(io);

// Export for use in controllers
export { collaborationSocket };

httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`Socket.IO server running on ws://localhost:${port}`);
});
