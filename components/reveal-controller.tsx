"use client";

import { useEffect } from "react";

const childRevealSelector = [
  "h1",
  "h2",
  "h3",
  "p",
  ".section-label",
  ".text-cta",
  ".button",
  ".program-media",
  ".program-copy > div",
  ".program-copy > a",
  ".location-map",
  ".location-console",
  ".r26-regional-mark",
].join(",");

export function RevealController() {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

    for (const node of revealNodes) {
      const children = Array.from(node.querySelectorAll<HTMLElement>(childRevealSelector))
        .filter((child) => child.closest(".reveal") === node)
        .slice(0, 8);

      if (children.length > 0) {
        node.classList.add("reveal-enhanced");
        children.forEach((child, index) => {
          child.classList.add("reveal-child");
          const step = mobile ? 36 : 70;
          const cap = mobile ? 144 : 350;
          child.style.setProperty("--reveal-delay", `${Math.min(index * step, cap)}ms`);
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
            threshold: mobile ? 0.04 : 0.14,
            rootMargin: mobile ? "0px 0px 2% 0px" : "0px 0px -8%",
          },
        );

    if (revealObserver) {
      revealNodes.forEach((node) => revealObserver.observe(node));
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      root.style.setProperty("--page-progress", progress.toFixed(4));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    if (!reducedMotion) window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      revealObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
