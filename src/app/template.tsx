"use client";

import { motion } from "framer-motion";

/**
 * A template (unlike a layout) re-mounts on every navigation, which gives us
 * the same fade/slide-in the old AnimatePresence shell had.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      id="main-content"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="flex min-h-screen flex-col"
    >
      {children}
    </motion.main>
  );
}
