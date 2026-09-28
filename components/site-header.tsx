"use client";

import { useEffect, useRef, useState } from "react";
import { Arrow, Brand } from "./brand";

const navItems = [
  ["O nama", "#o-nama"],
  ["Proizvodnja", "#proizvodnja"],
  ["Program", "#proizvodi"],
  ["Centri", "#lokacije"],
  ["Karijere", "#karijere"],
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-lock", menuOpen);
    if (!menuOpen) return () => document.body.classList.remove("menu-lock");

    const focusable = menuRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [];
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("menu-lock");
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <Brand />
        <nav className="desktop-nav" aria-label="Glavna navigacija">
          {navItems.map(([label, href]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
        <a className="header-cta" href="#kontakt">
          Kontakt <Arrow />
        </a>
        <button
          ref={triggerRef}
          className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Zatvori meni" : "Otvori meni"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </header>

      <div
        ref={menuRef}
        id="mobile-navigation"
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobilna navigacija">
          {[...navItems, ["Kontakt", "#kontakt"] as const].map(([label, href], index) => (
            <a key={href} href={href} onClick={close}>
              <span>0{index + 1}</span>
              {label}
              <Arrow />
            </a>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <span>Crna Gora</span>
          <a href="mailto:agromont@agro.co.me">agromont@agro.co.me</a>
        </div>
      </div>
    </>
  );
}
