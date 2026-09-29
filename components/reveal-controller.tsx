"use client";

import { useEffect } from "react";

const copyRevealSelector = [
  ".r26-proof-head.reveal",
  ".section-heading.reveal",
  ".location-head.reveal",
  ".r26-network-item.reveal",
  ".r26-bridge.reveal",
  ".r26-regional-copy.reveal",
  ".career-copy.reveal",
  ".contact-copy.reveal",
].join(",");

export function RevealController() {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>(".r26 .reveal"));

    root.classList.add("reveal-enabled");

    const copyNodes = new Set(
      Array.from(document.querySelectorAll<HTMLElement>(copyRevealSelector)),
    );

    for (const node of revealNodes) {
      if (copyNodes.has(node)) {
        node.classList.add("reveal-copy");
        Array.from(node.children)
          .filter((child): child is HTMLElement => child instanceof HTMLElement)
          .slice(0, 6)
          .forEach((child, index) => {
            child.classList.add("reveal-part");
            child.style.setProperty("--reveal-delay", `${Math.min(index * 75, 300)}ms`);
          });
      }

      if (reducedMotion) node.classList.add("is-visible");
    }

    const revealObserver = reducedMotion
      ? null
      : new IntersectionObserver(
          (entries, observer) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          },
          {
            threshold: 0.01,
            rootMargin: window.innerWidth <= 820
              ? "0px 0px -8% 0px"
              : "0px 0px -12% 0px",
          },
        );

    revealNodes.forEach((node) => {
      if (revealObserver) revealObserver.observe(node);
    });

    let raf = 0;
    const updateProgress = () => {
      raf = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      root.style.setProperty("--page-progress", progress.toFixed(4));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    if (!reducedMotion) window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      revealObserver?.disconnect();
      root.classList.remove("reveal-enabled");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
