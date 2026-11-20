// Latar kartu ala ilustrasi di referensi: gradasi senja/malam, dipilih stabil dari id sesi.
const PALETTES: Array<[string, string, string]> = [
  ['#f4a3a0', '#a35e8f', '#2b2d5c'], // senja merah muda
  ['#7ec8e3', '#5a7fc2', '#1e2a58'], // biru malam
  ['#f6c28b', '#d9788f', '#43336b'], // jingga ungu
  ['#8fd3c1', '#4d8fae', '#1b3358'], // teal
  ['#c3a6f2', '#7a6cd0', '#252a6a'], // ungu
  ['#f0d28a', '#c9807a', '#4a2f5c'], // emas rosa
];

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function artStyle(id: string): React.CSSProperties {
  const h = hash(id);
  const [a, b, c] = PALETTES[h % PALETTES.length];
  const x = 15 + (h >> 4) % 70;
  const y = 12 + (h >> 9) % 30;
  return {
    backgroundImage:
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,.55) 0, rgba(255,255,255,0) 14%),` +
      `radial-gradient(120% 90% at ${x}% ${y + 8}%, ${a} 0%, ${b} 48%, ${c} 100%)`,
  };
}
