import './globals.css';
import { Inter } from 'next/font/google';
import { Navigation } from '@/components/Navigation';

export const metadata = {
  title: 'Kuzey Kose',
  description: "Kuzey's personal website",
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <link
        rel="icon"
        type="image/svg+xml"
        sizes="any"
        href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍄</text></svg>"
      />
      <body className={inter.className + ' text-zinc-800'}>
        <div className="mx-auto max-w-2xl lg:max-w-6xl p-6">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
