"use client";

import { motion } from "framer-motion";

export default function ProductShowcaseSection() {
  return (
    <section className="px-6 py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Product
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built for the field
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Available on any device — whether you&apos;re at the pharmacy counter or checking
            medicines at home.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16">
          {/* Mobile frame */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -3 }}
            whileInView={{ opacity: 1, y: 0, rotate: -3 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div
              className="w-[200px] h-[400px] rounded-[2.5rem] border-2 border-white/15 bg-white/5 backdrop-blur-md flex flex-col items-center justify-between p-4 shadow-2xl"
              style={{ boxShadow: "0 0 60px rgba(124,58,237,0.15)" }}
            >
              {/* Speaker */}
              <div className="w-20 h-1.5 rounded-full bg-white/10 mt-1" />
              {/* Screen content placeholder */}
              <div className="flex-1 w-full mt-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 p-4">
                <div className="h-3 rounded bg-white/15 w-3/4" />
                <div className="h-3 rounded bg-white/10 w-full" />
                <div className="h-3 rounded bg-white/10 w-5/6" />
                <div className="h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 mt-2" />
                <div className="h-3 rounded bg-white/8 w-full" />
                <div className="h-3 rounded bg-white/8 w-4/5" />
              </div>
              {/* Home indicator */}
              <div className="w-24 h-1 rounded-full bg-white/20 mb-1" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/30 whitespace-nowrap">
              Mobile App
            </div>
          </motion.div>

          {/* Laptop frame */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="relative"
          >
            <div className="flex flex-col items-center">
              {/* Screen */}
              <div
                className="w-[480px] max-w-[90vw] h-[300px] rounded-t-2xl border-2 border-b-0 border-white/15 bg-white/5 backdrop-blur-md p-4 shadow-2xl"
                style={{ boxShadow: "0 0 80px rgba(37,99,235,0.15)" }}
              >
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="flex-1 h-4 rounded bg-white/5 mx-2" />
                </div>
                {/* Content */}
                <div className="flex gap-3 h-[calc(100%-2rem)]">
                  <div className="w-36 rounded-lg bg-white/5 border border-white/8 flex flex-col gap-2 p-3">
                    <div className="h-2 rounded bg-white/15 w-full" />
                    <div className="h-2 rounded bg-white/10 w-4/5" />
                    <div className="h-2 rounded bg-white/8 w-full" />
                    <div className="h-2 rounded bg-purple-500/30 w-3/4 mt-2" />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3 rounded bg-white/15 w-2/3" />
                    <div className="h-2 rounded bg-white/8 w-full" />
                    <div className="h-2 rounded bg-white/8 w-5/6" />
                    <div className="flex-1 rounded-lg bg-white/5 border border-white/8 mt-1" />
                  </div>
                </div>
              </div>
              {/* Keyboard base */}
              <div className="w-[520px] max-w-[95vw] h-5 rounded-b-xl border-2 border-t-0 border-white/10 bg-white/3" />
              <div className="w-[200px] h-3 rounded-b-xl bg-white/8 -mt-0.5" />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/30 whitespace-nowrap">
              Web Dashboard
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
