import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
dotenv.config();

import { notFound, errorHandler } from './utils/middleware.js';
import userRoutes from './routes/users.js';
const PORT = process.env.PORT ?? 5000;
const server = express();

server.use(cookieParser());
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use('/api/users', userRoutes);

server.use(notFound);
server.use(errorHandler);

server.listen(Number(PORT), () => console.log(`Server 🚀🚀 on port ${PORT}!`));
