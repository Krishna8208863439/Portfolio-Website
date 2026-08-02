import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import CursorGlow from '@/components/ui/CursorGlow';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Krishna Devadkar | Senior Full Stack Developer & AI Engineer',
  description:
    'Portfolio of Krishna Devadkar - Senior Full Stack Developer and AI Engineer specializing in Next.js 15, React 19, TypeScript, Python, TensorFlow, and scalable cloud APIs.',
  keywords: [
    'Krishna Devadkar',
    'Full Stack Developer',
    'AI Engineer',
    'Next.js 15',
    'React 19',
    'TypeScript',
    'Python Developer',
    'Portfolio',
    'Machine Learning',
    'Web Development',
  ],
  authors: [{ name: 'Krishna Devadkar' }],
  creator: 'Krishna Devadkar',
  publisher: 'Krishna Devadkar',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://krishnadevadkar.vercel.app',
    title: 'Krishna Devadkar | Senior Full Stack Developer & AI Engineer',
    description:
      'High-performance Next.js web applications, artificial intelligence vision systems, and cloud microservices.',
    siteName: 'Krishna Devadkar Portfolio',
    images: [
      {
        url: '/images/profile.png',
        width: 1200,
        height: 630,
        alt: 'Krishna Devadkar Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Krishna Devadkar | Full Stack & AI Engineer',
    description:
      'Crafting production-ready web apps and generative AI systems with Next.js, React 19, and Python.',
    images: ['/images/profile.png'],
    creator: '@krishna_dev',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Krishna Devadkar',
    url: 'https://krishnadevadkar.vercel.app',
    jobTitle: 'Senior Full Stack Developer & AI Engineer',
    worksFor: {
      '@type': 'Organization',
      name: 'TechCorp Innovations',
    },
    sameAs: [
      'https://github.com/krishna-devadkar',
      'https://linkedin.com/in/krishna-devadkar',
      'https://x.com/krishna_dev',
    ],
    knowsAbout: [
      'Next.js',
      'React',
      'TypeScript',
      'Python',
      'Artificial Intelligence',
      'Machine Learning',
      'Cloud Microservices',
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} scroll-smooth`}>
      <head>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-950 text-white font-sans antialiased selection:bg-blue-500 selection:text-white">
        <ThemeProvider>
          <CursorGlow />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
