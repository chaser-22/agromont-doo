"use client";

import { useEffect } from "react";

export function RevealController() {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6%" },
    );

    document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      root.style.setProperty("--page-progress", progress.toFixed(4));

      const production = document.querySelector<HTMLElement>(".production-experience");
      if (production) {
        const rect = production.getBoundingClientRect();
        const distance = Math.max(production.offsetHeight - window.innerHeight, 1);
        const sectionProgress = Math.min(Math.max(-rect.top / distance, 0), 1);
        root.style.setProperty("--production-progress", sectionProgress.toFixed(4));
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    if (!reducedMotion) window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
