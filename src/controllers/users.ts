import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import {
  checkPassword,
  generateToken,
  hashPassword,
} from '../utils/helpers.js';
import { prisma } from '../libs/prismaDb.js';
import { CustomUserReq } from '../utils/types.js';

const fetchAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query['page'] ? Number(req.query['page']) : 1;
  const limit = req.query['limit'] ? Number(req.query['limit']) : 4;

  const usersCount = await prisma.user.count();
  const users = await prisma.user.findMany({
    take: limit,
    skip: (page - 1) * limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isAdmin: true,
    },
  });
  const pageCount = Math.ceil(usersCount / limit);

  res.json({ usersCount, users, pageCount });
});

const signUpAUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, firstName, lastName, password } = req.body;
  let isAdmin = req.body.isAdmin ? true : false;

  if (!email || !firstName || !password || !lastName) {
    res.status(401);
    throw new Error('All fields are required!');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    res.status(400);
    throw new Error('User with the credentials found in the DB!');
  }

  try {
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: { email, firstName, lastName, password: hashedPassword, isAdmin },
    });

    generateToken(res, { id: newUser.id });

    res.status(201).json({
      id: newUser.id,
      isAdmin: newUser.isAdmin,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
    });
  } catch (err: unknown) {
    res.status(400);
    throw new Error((err as Error).message);
  }
});

const signInAUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('All fields are required!');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      isAdmin: true,
      password: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!user) {
    res.status(404);
    throw new Error('Invalid user credentials!');
  }

  const passwordsMatch = await checkPassword(password, user.password);

  if (passwordsMatch === false) {
    res.status(400);
    throw new Error('Invalid user credentials!');
  }
  try {
    generateToken(res, { id: user.id });

    res.status(200).json({
      id: user.id,
      isAdmin: user.isAdmin,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  } catch (err: unknown) {
    throw new Error((err as Error).message);
  }
});

const signOutAUser = asyncHandler(async (req: Request, res: Response) => {
  res
    .cookie('mission-games-bh', '', { httpOnly: true, maxAge: 0 })
    .json({ message: 'logout successful' });
});

const getAUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as CustomUserReq).userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) {
    res.status(400);
    throw new Error('User not found!');
  }

  res.json(user);
});

const updateAUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as CustomUserReq).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    res.status(400);
    throw new Error('User not found!');
  }

  try {
    let updateInfo: Partial<typeof user> = {};
    updateInfo.firstName = req.body.firstName || updateInfo.firstName;
    updateInfo.lastName = req.body.lastName || updateInfo.lastName;

    if (req.body.password) {
      const hashedPassword = await hashPassword(req.body.password);
      updateInfo.password = req.body.password
        ? hashedPassword
        : updateInfo.password;
    }

    let updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { ...updateInfo },
    });

    res.status(200).json({ user: updatedUser });
  } catch (err: unknown) {
    throw new Error((err as Error).message);
  }
});

const deleteAUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as CustomUserReq).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    res.status(400);
    throw new Error('User not found!');
  }

  try {
    await prisma.user.delete({ where: { id: userId } });

    res
      .cookie('mission-games-bh', '', { httpOnly: true, maxAge: 0 })
      .json({ message: 'User deletion successful!' });
  } catch (err: unknown) {
    throw new Error((err as Error).message);
  }
});

export {
  fetchAllUsers,
  signUpAUser,
  signInAUser,
  signOutAUser,
  getAUserById,
  updateAUserById,
  deleteAUserById,
};
