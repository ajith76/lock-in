import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

// ── GET /api/stats?month=4&year=2026 ──
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const query = querySchema.parse(req.query);

    const monthStr = String(query.month).padStart(2, '0');
    const datePrefix = `${query.year}-${monthStr}`;

    // Get user's habits
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });
    const habitIds = habits.map((h: any) => h.id);
    const totalHabits = habitIds.length;

    if (totalHabits === 0) {
      res.json({
        totalHabits: 0,
        totalCompletions: 0,
        completionRate: 0,
        dailyAverage: 0,
        bestStreak: 0,
        dailyCounts: [],
      });
      return;
    }

    // Get completions for the month
    const completions = await prisma.completion.findMany({
      where: {
        habitId: { in: habitIds },
        date: { startsWith: datePrefix },
      },
      select: { date: true },
    });

    // Count completions per day
    const daysInMonth = new Date(query.year, query.month, 0).getDate();
    const dailyCounts: number[] = new Array(daysInMonth).fill(0);

    for (const c of completions) {
      const day = parseInt(c.date.split('-')[2]!, 10);
      if (day >= 1 && day <= daysInMonth) {
        dailyCounts[day - 1]!++;
      }
    }

    const totalCompletions = completions.length;

    // Calculate active days (up to today if current month)
    const now = new Date();
    const isCurrentMonth = query.year === now.getFullYear() && query.month === now.getMonth() + 1;
    const activeDays = isCurrentMonth ? now.getDate() : daysInMonth;
    const totalPossible = totalHabits * activeDays;
    const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
    const dailyAverage = activeDays > 0
      ? Math.round((dailyCounts.slice(0, activeDays).reduce((s, c) => s + c, 0) / activeDays) * 10) / 10
      : 0;

    // Best streak
    let bestStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < activeDays; i++) {
      if (dailyCounts[i]! > 0) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    res.json({
      totalHabits,
      totalCompletions,
      completionRate,
      dailyAverage,
      bestStreak,
      dailyCounts,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message ?? 'Validation error' });
      return;
    }
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
