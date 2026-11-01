<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/split';

  // issues: where each problem is now tracked, problem → issue url.
  // outcome: what engineering decided per problem, problem → words.
  let { ticket, issues = {}, outcome = {} }: { ticket: number; issues?: Partial<Record<Problem, string>>; outcome?: Partial<Record<Problem, string>> } = $props();

  const LABEL: Record<Problem, string> = {
    parser: 'shared parser reads day-first dates month first',
    hint: 'booking-v3 form hints MM/DD/YYYY, reads day first',
    move: 'date moves one day (timezone), not a swap',
    unplaced: 'no tenant on file',
  };

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const total = $derived(split.groups.reduce((n, g) => n + g.reports.length, 0));
  const tags = (t: Record<string, number>) =>
    Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
  const issueNo = (url: string) => '#' + url.split('/').pop();
</script>

<p class="sum">
  <strong>{split.unique}</strong> reports merged into #{ticket} ({split.rows} rows in the export, one per id kept) ·
  <strong>{split.groups.length}</strong> {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>intake tagged</th><th>tracked in</th><th>outcome</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code> {LABEL[g.problem]}</td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td class="tags">{tags(g.taggedAs)}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>{issueNo(issues[g.problem]!)}</a>{:else}<span class="none">no ticket</span>{/if}</td>
        <td>{outcome[g.problem] ?? 'open'}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td><strong>{total}</strong></td><td colspan="5"></td></tr>
  </tfoot>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
