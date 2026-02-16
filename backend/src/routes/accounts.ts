import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  username: z.string().min(1),
  dailyLimit: z.number().int().positive(),
  active: z.boolean().default(true),
});

router.get("/", async (req: AuthRequest, res) => {
  const accounts = await prisma.shopeeAccount.findMany({ where: { userId: req.userId } });
  res.json(accounts);
});

router.post("/", async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const account = await prisma.shopeeAccount.create({
    data: {
      userId: req.userId!,
      username: parsed.data.username,
      dailyLimit: parsed.data.dailyLimit,
      active: parsed.data.active,
    },
  });

  res.status(201).json(account);
});

export default router;
