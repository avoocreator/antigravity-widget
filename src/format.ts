const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const pad = (n: number) => String(n).padStart(2, '0');
export const clock = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ago(ms: number, now: number): string {
  const d = Math.max(0, now - ms);
  if (d < MIN) return 'baru saja';
  if (d < HOUR) return `${Math.floor(d / MIN)} mnt lalu`;
  if (d < DAY) return `${Math.floor(d / HOUR)} jam lalu`;
  return `${Math.floor(d / DAY)} hari lalu`;
}

export function until(ms: number, now: number): string {
  const d = Math.max(0, ms - now);
  if (d < MIN) return 'sebentar lagi';
  if (d < HOUR) return `${Math.ceil(d / MIN)} mnt`;
  if (d < DAY) {
    const h = Math.floor(d / HOUR);
    const m = Math.floor((d % HOUR) / MIN);
    return m && h < 6 ? `${h}j ${m}m` : `${h} jam`;
  }
  return `${Math.floor(d / DAY)} hari`;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function dayLabel(ms: number, now: number): string {
  const d = new Date(ms);
  const t = new Date(now);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(t)) / DAY);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Besok';
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fullDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${clock(ms)}`;
}

export function dateHeading(now: number): string {
  const d = new Date(now);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
