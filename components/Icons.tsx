type P = { className?: string };
const base = {
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
};

export const IconWarning = ({ className }: P) => (
  <svg {...base} className={className}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
);
export const IconPlus = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconDownload = ({ className }: P) => (
  <svg {...base} className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
);
export const IconEdit = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const IconTrash = ({ className }: P) => (
  <svg {...base} className={className}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></svg>
);
export const IconLogout = ({ className }: P) => (
  <svg {...base} className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const IconClock = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
);
export const IconSort = ({ className }: P) => (
  <svg {...base} className={className}><path d="m7 15 5 5 5-5M7 9l5-5 5 5" /></svg>
);
export const IconHome = ({ className }: P) => (
  <svg {...base} className={className}><path d="m3 11 9-8 9 8M5 10v10h14V10" /></svg>
);
export const IconList = ({ className }: P) => (
  <svg {...base} className={className}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
);
export const IconUsers = ({ className }: P) => (
  <svg {...base} className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>
);
export const IconMenu = ({ className }: P) => (
  <svg {...base} className={className}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);
export const IconSearch = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
export const IconCalendar = ({ className }: P) => (
  <svg {...base} className={className}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
