import { Metadata } from 'next';

export const DEFAULT_METADATA: Metadata = {
  title: {
    template: 'Juki Mermaid | %s',
    default: 'Juki Mermaid',
  },
  description: 'Create and share beautiful diagrams powered by AI. Build flowcharts, sequence diagrams, class diagrams, and more with a simple text editor.',
  applicationName: 'Juki Mermaid',
  keywords: [ 'Juki Mermaid', 'mermaid', 'diagrams', 'flowchart', 'sequence diagram', 'AI diagrams', 'juki' ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'Juki Mermaid',
    description: 'Create and share beautiful diagrams powered by AI. Build flowcharts, sequence diagrams, class diagrams, and more with a simple text editor.',
    siteName: 'Juki Mermaid',
    url: 'https://mermaid.juki.app',
    images: [
      {
        url: 'https://images.juki.pub/assets/juki-judge-court.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Juki Mermaid',
    description: 'Create and share beautiful diagrams powered by AI. Build flowcharts, sequence diagrams, class diagrams, and more with a simple text editor.',
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
    title: 'Juki Mermaid',
    statusBarStyle: 'default',
    startupImage: [
      '/icons/apple-touch-icon.png',
    ],
  },
};
