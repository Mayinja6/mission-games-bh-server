import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { verifyToken } from './helpers.js';
import { CustomUserReq, NewJwtPayload } from './types.js';
import { prisma } from '../libs/prismaDb.js';

const notFound = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(404);
    throw new Error(`Route not found - ${req.originalUrl}`);
  }
);

async function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message;
  const stack = process.env.NODE_ENV === 'development' ? err.stack : '';

  res.status(statusCode).json({
    message,
    stack,
  });
}

const loginRequired = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies['mission-games-bh'];

    if (token === undefined || token === '') {
      res.status(401);
      throw new Error('Not authorized, No token!');
    }

    const verified = verifyToken(token);

    if (!verified) {
      res.status(401);
      throw new Error('Not authorized, Invalid token!');
    }

    (req as CustomUserReq).userId = (verified as NewJwtPayload).id;

    next();
  }
);

const adminsRoute = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as CustomUserReq).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isAdmin: true,
      },
    });

    if (!user) {
      res.status(400);
      throw new Error('User not found!');
    }

    if (user.isAdmin === false) {
      res.status(401);
      throw new Error('Invalid user credentials!');
    }

    next();
  }
);

export { notFound, errorHandler, loginRequired, adminsRoute };
