"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = {
  "/": {
    name: "home",
  },
  "/blog": {
    name: "blog",
  },
};

export function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="-ml-[8px] mb-16 tracking-tight">
      <div className="lg:sticky lg:top-20">
        <nav
          className="flex flex-row justify-between items-start relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 md:relative"
          id="nav"
        >
          <div className="flex flex-row space-x-0 pr-10">
            {Object.entries(navItems).map(([path, { name }]) => {
              const isRoot = path === "/";
              const isActive = isRoot
                ? pathname === "/"
                : pathname === path || pathname.startsWith(path + "/");
              return (
                <Link
                  key={path}
                  href={path}
                  className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 m-1 ${
                    isActive
                      ? "underline underline-offset-4 decoration-orange-600"
                      : ""
                  }`}
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
