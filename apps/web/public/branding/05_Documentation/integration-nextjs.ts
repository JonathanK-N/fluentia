/** Fluentia metadata — Jonathan Kakesa. Adapter dans app/layout.tsx. */
import type { Metadata } from 'next';
export const metadata: Metadata = {
 title: 'Fluentia',
 description: 'Maîtrisez le français, allez plus loin.',
 manifest: '/manifest.webmanifest',
 icons: { icon: [{url:'/favicon.ico',sizes:'any'},{url:'/favicon-32x32.png',sizes:'32x32',type:'image/png'}], apple:'/brand/icons/apple-touch-icon-180.png' },
};
