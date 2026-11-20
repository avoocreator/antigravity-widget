import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};
const I = (d: string) => (p: SVGProps<SVGSVGElement>) => <svg {...base} {...p} dangerouslySetInnerHTML={{ __html: d }} />;

export const Play = (p: SVGProps<SVGSVGElement>) => <svg {...base} {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>;
export const Pin = I('<path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6Z"/>');
export const Close = I('<path d="M18 6 6 18M6 6l12 12"/>');
export const Search = I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>');
export const Clock = I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
export const Alert = I('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>');
export const Check = I('<path d="M20 6 9 17l-5-5"/>');
export const History = I('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>');
export const Spark = I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>');
