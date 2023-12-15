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
    // { name: 'Blog', path: '/blog', key: 'blog_/blog' },
  ];

  return (
    <nav className="flex items-center justify-between gap-4">
      <div>🍄</div>
      <div className="flex gap-4">
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
      </div>
    </nav>
  );
};
