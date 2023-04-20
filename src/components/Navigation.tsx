'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

export const Navigation = () => {
  const pathname = usePathname();

  const pages = [
    { name: 'Home', path: '/', key: 'home_/' },
    { name: 'About', path: '/about', key: 'about_/about' },
    { name: 'Blog', path: '/blog', key: 'blog_/blog' },
    { name: 'Youtube', path: 'https://www.youtube.com/kuzeykose', key: 'youtube_/youtube' },
  ];

  return (
    <nav className="flex gap-6 bg-white/90 mx-auto rounded-xl shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur p-1 max-w-fit">
      {pages.map((page) => (
        <Link
          href={page.path}
          className={clsx('relative block cursor-pointer px-2 py-1 rounded-lg hover:bg-zinc-100')}
          key={page.key}
        >
          {page.name}
          {pathname === page.path && <span className="absolute h-1 w-1 bg-red-400 rounded-full bottom-0 left-1/2" />}
        </Link>
      ))}
    </nav>
  );
};
