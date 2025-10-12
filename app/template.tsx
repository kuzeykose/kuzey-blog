"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Track if it's the very first page load across all navigations
let hasLoadedBefore = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark as ready after component mounts
    setIsReady(true);
    hasLoadedBefore = true;
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      initial={hasLoadedBefore ? { opacity: 0, y: 10 } : false}
      animate={isReady ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.15,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
