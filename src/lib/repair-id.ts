import { Prisma } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;

/**
 * Concurrency-safe, atomic sequential Repair ID generator.
 * Format: REP-YYYY-XXXXX (e.g. REP-2026-00001)
 *
 * Uses PostgreSQL row-level locks and atomic UPSERT (ON CONFLICT DO UPDATE)
 * inside a database transaction, guaranteeing that concurrent submissions
 * by multiple users never generate duplicate or colliding IDs.
 */
export async function generateNextRepairId(tx: TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();

  try {
    // Atomic PostgreSQL row lock and increment
    const result = await tx.$queryRaw<{ last_value: number }[]>`
      INSERT INTO "repair_sequences" ("year", "last_value", "updated_at")
      VALUES (${currentYear}, 1, NOW())
      ON CONFLICT ("year")
      DO UPDATE SET "last_value" = "repair_sequences"."last_value" + 1, "updated_at" = NOW()
      RETURNING "last_value";
    `;

    if (result && result.length > 0) {
      const nextNum = Number(result[0].last_value);
      return `REP-${currentYear}-${String(nextNum).padStart(5, '0')}`;
    }
  } catch {
    // Fallback to Prisma upsert with atomic increment if raw query syntax differs
  }

  const seq = await tx.repairSequence.upsert({
    where: { year: currentYear },
    create: { year: currentYear, last_value: 1 },
    update: { last_value: { increment: 1 } },
  });

  return `REP-${currentYear}-${String(seq.last_value).padStart(5, '0')}`;
}
