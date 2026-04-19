import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require auth
router.use(authMiddleware);

const createHabitSchema = z.object({
  name: z.string().max(200).default(''),
  order: z.number().int().min(0).optional(),
});

const updateHabitSchema = z.object({
  name: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
});

// ── GET /api/habits ──
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, order: true, createdAt: true },
    });

    res.json({ habits });
  } catch (err) {
    console.error('Get habits error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/habits ──
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = createHabitSchema.parse(req.body);

    // Auto-assign order if not provided
    let order = body.order;
    if (order === undefined) {
      const count = await prisma.habit.count({ where: { userId: req.userId } });
      order = count;
    }

    const habit = await prisma.habit.create({
      data: {
        name: body.name,
        order,
        userId: req.userId!,
      },
      select: { id: true, name: true, order: true, createdAt: true },
    });

    res.status(201).json({ habit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message ?? 'Validation error' });
      return;
    }
    console.error('Create habit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/habits/:id ──
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const body = updateHabitSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.habit.findFirst({
      where: { id: req.params['id'], userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    const habit = await prisma.habit.update({
      where: { id: req.params['id'] },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.order !== undefined && { order: body.order }),
      },
      select: { id: true, name: true, order: true, createdAt: true },
    });

    res.json({ habit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message ?? 'Validation error' });
      return;
    }
    console.error('Update habit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /api/habits/:id ──
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Verify ownership
    const existing = await prisma.habit.findFirst({
      where: { id: req.params['id'], userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    await prisma.habit.delete({ where: { id: req.params['id'] } });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    console.error('Delete habit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
