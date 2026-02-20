import { Metadata } from 'next';

export const DEFAULT_METADATA: Metadata = {
  title: {
    template: 'Juki Excalidraw | %s',
    default: 'Juki Excalidraw',
  },
  description: 'Create and collaborate on interactive whiteboards in real-time with Juki Excalidraw. Share your drawings instantly with your team.',
  applicationName: 'Juki Excalidraw',
  keywords: [ 'Juki Excalidraw', 'excalidraw', 'collaborative whiteboard', 'drawing', 'diagrams', 'real-time collaboration', 'juki' ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'Juki Excalidraw',
    description: 'Create and collaborate on interactive whiteboards in real-time with Juki Excalidraw. Share your drawings instantly with your team.',
    siteName: 'Juki Excalidraw',
    url: 'https://excalidraw.juki.app',
    images: [
      {
        url: 'https://images.juki.pub/assets/juki-judge-court.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Juki Excalidraw',
    description: 'Create and collaborate on interactive whiteboards in real-time with Juki Excalidraw. Share your drawings instantly with your team.',
    creator: '@oscar_gauss',
    images: [ 'https://images.juki.pub/assets/juki-judge-court.png' ], // Must be an absolute URL
  },
  verification: {
    google: 'google',
    yandex: 'yandex',
    yahoo: 'yahoo',
    other: {
      me: [ 'oscargauss@juki.app', 'https://www.oscargauss.com' ],
    },
  },
  appleWebApp: {
    capable: true,
    title: 'Juki Excalidraw',
    statusBarStyle: 'default',
    startupImage: [
      '/icons/apple-touch-icon.png',
    ],
  },
};
