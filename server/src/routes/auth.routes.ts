import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Validation Schemas ──
const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// ── Helpers ──
function generateTokens(userId: string) {
  const accessSecret = process.env['JWT_ACCESS_SECRET']!;
  const refreshSecret = process.env['JWT_REFRESH_SECRET']!;

  const accessToken = jwt.sign({ userId }, accessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ── POST /api/auth/register ──
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
      },
    });

    // Create 5 default empty habits
    const habitData = Array.from({ length: 5 }, (_, i) => ({
      name: '',
      order: i,
      userId: user.id,
    }));
    await prisma.habit.createMany({ data: habitData });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message ?? 'Validation error' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/auth/login ──
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const validPassword = await bcrypt.compare(body.password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message ?? 'Validation error' });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/auth/logout ──
router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out' });
});

// ── POST /api/auth/refresh ──
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  const refreshTokenCookie = req.cookies?.['refresh_token'] as string | undefined;

  if (!refreshTokenCookie) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const secret = process.env['JWT_REFRESH_SECRET']!;
    const decoded = jwt.verify(refreshTokenCookie, secret) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    setTokenCookies(res, accessToken, refreshToken);

    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── GET /api/auth/me ──
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
