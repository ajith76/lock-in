import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

const toggleSchema = z.object({
  habitId: z.string().uuid('Invalid habit ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

// ── GET /api/completions?month=4&year=2026 ──
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const query = querySchema.parse(req.query);

    // Build date prefix for the month: "2026-04"
    const monthStr = String(query.month).padStart(2, '0');
    const datePrefix = `${query.year}-${monthStr}`;

    // Get all user's habit IDs
    const userHabits = await prisma.habit.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });
    const habitIds = userHabits.map((h: any) => h.id);

    if (habitIds.length === 0) {
      res.json({ completions: {} });
      return;
    }

    // Get completions for those habits in this month
    const completions = await prisma.completion.findMany({
      where: {
        habitId: { in: habitIds },
        date: { startsWith: datePrefix },
      },
      select: { habitId: true, date: true },
    });

    // Build a map: { habitId: { "2026-04-19": true } }
    const completionMap: Record<string, Record<string, boolean>> = {};
    for (const c of completions) {
      if (!completionMap[c.habitId]) {
        completionMap[c.habitId] = {};
      }
      completionMap[c.habitId][c.date] = true;
    }

    res.json({ completions: completionMap });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message ?? 'Validation error' });
      return;
    }
    console.error('Get completions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/completions/toggle ──
router.post('/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const body = toggleSchema.parse(req.body);

    // Verify the habit belongs to the user
    const habit = await prisma.habit.findFirst({
      where: { id: body.habitId, userId: req.userId },
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    // Check if completion exists
    const existing = await prisma.completion.findUnique({
      where: {
        habitId_date: {
          habitId: body.habitId,
          date: body.date,
        },
      },
    });

    if (existing) {
      // Delete it (toggle off)
      await prisma.completion.delete({ where: { id: existing.id } });
      res.json({ completed: false, habitId: body.habitId, date: body.date });
    } else {
      // Create it (toggle on)
      await prisma.completion.create({
        data: {
          habitId: body.habitId,
          date: body.date,
        },
      });
      res.json({ completed: true, habitId: body.habitId, date: body.date });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message ?? 'Validation error' });
      return;
    }
    console.error('Toggle completion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
