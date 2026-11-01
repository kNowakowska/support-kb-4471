// Splits a merged ticket into the problems its reports actually describe.
// causes.ts places a report by tenant and form; the desk's own reading (desk-notes.json) wins
// where the desk saw a different problem than the tenant implies: those reports get their own group.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'move' | 'unplaced';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'move', 'unplaced'];

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // What intake tagged them as: tag → count.
  taggedAs: Record<string, number>;
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'move';
  return causeOf(r, t) ?? 'unplaced';
}

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; unique: number; groups: ProblemGroup[] } {
  const merged = all.filter((r) => r.mergedInto === ticket);
  const unique = uniqueById(merged);
  const groups = PROBLEMS.map((problem) => {
    const rs = unique.filter((r) => problemOf(r, tenantOf(r), oneDayMove) === problem);
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    return {
      problem,
      reports: rs,
      tenants: new Set(rs.map((r) => r.tenant)).size,
      firstSeen: days[0] ?? '',
      lastSeen: days[days.length - 1] ?? '',
      taggedAs: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
    };
  }).filter((g) => g.reports.length > 0);
  return { rows: merged.length, unique: unique.length, groups };
}
