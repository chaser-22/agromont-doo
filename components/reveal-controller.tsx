"use client";

import { useEffect } from "react";

const staggerSelector = [
  ".r26-proof-head.reveal",
  ".r26-fact.reveal",
  ".r26-source-note.reveal",
  ".r26-network-head.reveal",
  ".r26-network-item.reveal",
  ".r26-bridge.reveal",
  ".section-heading.reveal",
  ".program-card.reveal",
  ".location-head.reveal",
  ".location-stage.reveal",
  ".r26-regional-copy.reveal",
  ".r26-regional-mark.reveal",
  ".career-copy.reveal",
  ".jobs.reveal",
  ".contact-copy.reveal",
].join(",");

function directElementChildren(node: HTMLElement) {
  return Array.from(node.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
}

export function RevealController() {
  useEffect(() => {
    const root = document.documentElement;
    const page = document.querySelector<HTMLElement>(".r26");
    if (!page) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 980px)").matches;
    root.classList.add("reveal-enabled");

    const observer = reducedMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          },
          {
            threshold: 0.01,
            rootMargin: isMobile ? "0px 0px -4% 0px" : "0px 0px -8% 0px",
          },
        );

    const prepare = (node: HTMLElement) => {
      if (node.dataset.revealPrepared === "true") return;
      node.dataset.revealPrepared = "true";

      if (node.matches(staggerSelector)) {
        node.classList.add("reveal-stagger");
        directElementChildren(node)
          .slice(0, 8)
          .forEach((child, index) => {
            child.classList.add("reveal-part");
            child.style.setProperty(
              "--reveal-delay",
              `${Math.min(index * (isMobile ? 45 : 65), isMobile ? 180 : 260)}ms`,
            );
          });
      }

      if (reducedMotion) {
        node.classList.add("is-visible");
      } else {
        observer?.observe(node);
      }
    };

    const prepareTree = (scope: ParentNode) => {
      if (scope instanceof HTMLElement && scope.matches(".reveal")) prepare(scope);
      scope.querySelectorAll<HTMLElement>(".reveal").forEach(prepare);
    };

    prepareTree(page);

    // Product filtering and other client-side UI can add new reveal nodes after mount.
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((added) => {
          if (added instanceof HTMLElement) prepareTree(added);
        });
      }
    });
    mutationObserver.observe(page, { childList: true, subtree: true });

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
      observer?.disconnect();
      mutationObserver.disconnect();
      root.classList.remove("reveal-enabled");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
