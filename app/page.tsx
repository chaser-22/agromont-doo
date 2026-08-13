"use client";

import Image from "next/image";
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type Product = {
  id: string;
  category: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  index: string;
  image: string;
  imageAlt: string;
};

const products: Product[] = [
  {
    id: "jaja",
    category: "proizvodnja",
    eyebrow: "Domaća proizvodnja",
    title: "Jaja i živinarski program",
    description:
      "Od kontrolisane proizvodnje do pouzdane isporuke — kvalitet koji svakog dana stiže do domaćinstava i partnera.",
    accent: "amber",
    index: "01",
    image: "/images/program-eggs-generated.webp",
    imageAlt: "Svježa domaća jaja u kartonskim pakovanjima",
  },
  {
    id: "hrana",
    category: "ishrana",
    eyebrow: "Za svaku fazu uzgoja",
    title: "Stočna hrana i koncentrati",
    description:
      "Programi za živinu, goveda i svinje, uz stručnu preporuku i stabilan kvalitet formulacije.",
    accent: "green",
    index: "02",
    image: "/images/program-feed-generated.webp",
    imageAlt: "Stočna hrana od žitarica uz pašnjak sa govedima",
  },
  {
    id: "zitarice",
    category: "ishrana",
    eyebrow: "Sigurna osnova proizvodnje",
    title: "Žitarice",
    description:
      "Kukuruz, pšenica i odabrane sirovine za gazdinstva, dostupne kroz mrežu AgroMont centara.",
    accent: "cream",
    index: "03",
    image: "/images/program-grain-generated.webp",
    imageAlt: "Pšenica i kukuruz spremni za poljoprivrednu proizvodnju",
  },
  {
    id: "oprema",
    category: "oprema",
    eyebrow: "Za rad bez zastoja",
    title: "Poljoprivredna oprema",
    description:
      "Mašine, priključci, alati i potrošni program birani za stvarne potrebe savremenog gazdinstva.",
    accent: "amber",
    index: "04",
    image: "/images/program-equipment-generated.webp",
    imageAlt: "Savremeni traktor obrađuje poljoprivredno zemljište",
  },
  {
    id: "ograde",
    category: "oprema",
    eyebrow: "Pouzdana infrastruktura",
    title: "Panelne ograde i sistemi",
    description:
      "Modularna rješenja za imanja, objekte i proizvodne prostore, uz podršku pri izboru elemenata.",
    accent: "green",
    index: "05",
    image: "/images/program-fencing-generated.webp",
    imageAlt: "Nova panelna ograda oko poljoprivrednog imanja",
  },
  {
    id: "odrzavanje",
    category: "odrzavanje",
    eyebrow: "Više od poljoprivrede",
    title: "Auto i program održavanja",
    description:
      "Odabrani proizvodi za njegu vozila, radionicu i svakodnevno održavanje opreme i prostora.",
    accent: "cream",
    index: "06",
    image: "/images/program-maintenance-generated.webp",
    imageAlt: "Mehaničar održava poljoprivredno vozilo u radionici",
  },
];

const filters = [
  { id: "sve", label: "Sve" },
  { id: "proizvodnja", label: "Proizvodnja" },
  { id: "ishrana", label: "Ishrana" },
  { id: "oprema", label: "Oprema" },
  { id: "odrzavanje", label: "Održavanje" },
];

const locations = [
  {
    id: "golubovci",
    city: "Golubovci",
    type: "Poljoprivredni centar",
    description:
      "Kompletan program za gazdinstva, stručna preporuka i podrška pri izboru proizvoda.",
    mapEmbed:
      "https://www.openstreetmap.org/export/embed.html?bbox=19.1682648%2C42.3136453%2C19.2682648%2C42.3736453&layer=mapnik&marker=42.3436453%2C19.2182648",
    mapLink: "https://www.openstreetmap.org/?mlat=42.3436453&mlon=19.2182648#map=14/42.3436453/19.2182648",
  },
  {
    id: "tuzi",
    city: "Tuzi",
    type: "Prodajni centar",
    description:
      "Savremena maloprodaja poljoprivrednog, baštenskog i pratećeg programa na jednom mjestu.",
    mapEmbed:
      "https://www.openstreetmap.org/export/embed.html?bbox=19.2800881%2C42.3361526%2C19.3800881%2C42.3961526&layer=mapnik&marker=42.3661526%2C19.3300881",
    mapLink: "https://www.openstreetmap.org/?mlat=42.3661526&mlon=19.3300881#map=14/42.3661526/19.3300881",
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`brand ${compact ? "brand-compact" : ""}`} href="#vrh" aria-label="AgroMont — početna">
      <span className="brand-logo-frame" aria-hidden="true">
        <Image
          className="brand-logo-image"
          src="/images/agromont-logo.jpg"
          alt=""
          width={1080}
          height={1350}
          sizes="(max-width: 760px) 96px, 102px"
          priority={!compact}
        />
      </span>
    </a>
  );
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("sve");
  const [activeLocation, setActiveLocation] = useState("golubovci");
  const [submitted, setSubmitted] = useState(false);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(
    () =>
      activeFilter === "sve"
        ? products
        : products.filter((product) => product.category === activeFilter),
    [activeFilter],
  );

  const selectedLocation = locations.find((location) => location.id === activeLocation) ?? locations[0];

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      document.documentElement.style.setProperty("--page-scroll", `${Math.min(y, 900)}px`);
      const progress = document.querySelector<HTMLElement>(".scroll-progress");
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.14 },
    );

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-lock", menuOpen);
    if (!menuOpen) return () => document.body.classList.remove("menu-lock");

    const menu = mobileMenuRef.current;
    const focusable = menu?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [];
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
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

  const closeMenu = () => setMenuOpen(false);

  const selectLocationWithKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + locations.length) % locations.length;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % locations.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = locations.length - 1;
    const nextLocation = locations[nextIndex];
    setActiveLocation(nextLocation.id);
    requestAnimationFrame(() => document.getElementById(`location-tab-${nextLocation.id}`)?.focus());
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (field: string, maxLength: number) =>
      Array.from(String(data.get(field) ?? ""))
        .filter((character) => {
          const code = character.charCodeAt(0);
          return code >= 32 && code !== 127;
        })
        .join("")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);

    if (text("website", 80)) return;

    const name = text("name", 80);
    const company = text("company", 120);
    const email = text("email", 254);
    const message = text("message", 1200);
    const requestedTopic = text("topic", 20);
    const topics: Record<string, string> = {
      proizvodi: "Proizvodi i dostupnost",
      b2b: "B2B saradnja",
      karijera: "Karijera",
      ostalo: "Ostalo",
    };
    const topic = topics[requestedTopic] ?? topics.ostalo;
    const subject = `AgroMont upit — ${topic}`;
    const body = [
      `Ime i prezime: ${name}`,
      `Kompanija: ${company || "Nije navedena"}`,
      `E-mail: ${email}`,
      `Tema: ${topic}`,
      "",
      "Poruka:",
      message,
    ].join("\r\n");

    setEmailDraft(
      `mailto:agromont@agro.co.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
    setSubmitted(true);
    form.reset();
  };

  return (
    <main id="vrh">
      <a className="skip-link" href="#sadrzaj">Preskoči na sadržaj</a>
      <div className="scroll-progress" aria-hidden="true" />

      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <Brand />
        <nav className="desktop-nav" aria-label="Glavna navigacija">
          <a href="#o-nama">O nama</a>
          <a href="#proizvodi">Proizvodi</a>
          <a href="#lokacije">Centri</a>
          <a href="#aktuelno">Aktuelno</a>
          <a href="#karijere">Karijere</a>
        </nav>
        <a className="header-cta" href="#kontakt">
          Kontakt <Arrow />
        </a>
        <button
          ref={menuButtonRef}
          className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Zatvori meni" : "Otvori meni"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </header>

      <div ref={mobileMenuRef} id="mobile-navigation" className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <nav aria-label="Mobilna navigacija">
          {[
            ["O nama", "#o-nama"],
            ["Proizvodi", "#proizvodi"],
            ["Centri", "#lokacije"],
            ["Aktuelno", "#aktuelno"],
            ["Karijere", "#karijere"],
            ["Kontakt", "#kontakt"],
          ].map(([label, href], index) => (
            <a href={href} onClick={closeMenu} key={href}>
              <span>0{index + 1}</span>{label}<Arrow />
            </a>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <span>Crna Gora</span>
          <a href="mailto:agromont@agro.co.me">agromont@agro.co.me</a>
        </div>
      </div>

      <section className="hero" aria-labelledby="hero-title">
        <Image
          className="hero-image"
          src="/images/agromont-hero.png"
          alt="Ilustrativni prikaz savremene poljoprivredne proizvodnje, silosa i distribucije u Crnoj Gori"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-content" id="sadrzaj">
          <div className="hero-kicker reveal">
            <span className="pulse-dot" />
            Domaća proizvodnja · Crna Gora
          </div>
          <h1 id="hero-title" className="reveal">
            Hranimo ono
            <br />
            što <em>raste.</em>
          </h1>
          <div className="hero-bottom reveal">
            <p>
              Vodeći proizvođač jaja i stočne hrane, uz mrežu centara koja poljoprivrednicima donosi sve na jedno mjesto.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#proizvodi">
                Istraži program <Arrow />
              </a>
              <a className="text-link" href="#lokacije">
                Pronađi centar <span>↓</span>
              </a>
            </div>
          </div>
        </div>
        <div className="hero-index" aria-hidden="true">
          <span>42°26&apos;N</span>
          <span>019°15&apos;E</span>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <span>Skrolujte</span><i />
        </div>
      </section>

      <section className="statement section-pad" id="o-nama">
        <div className="section-label reveal"><span>01</span> AgroMont danas</div>
        <div className="statement-grid">
          <h2 className="reveal">
            Od sigurnog porijekla do sigurnog izbora.
          </h2>
          <div className="statement-copy reveal">
            <p className="lead">
              Gradimo sistem u kojem proizvodnja, stručnost i dostupnost rade kao jedna cjelina.
            </p>
            <p>
              AgroMont povezuje domaću proizvodnju jaja i stočne hrane sa pažljivo biranim programom za poljoprivredu, domaćinstvo i održavanje. Naš cilj je jednostavan: da partner dobije pouzdan proizvod, jasan savjet i podršku kada mu je potrebna.
            </p>
            <a className="underline-link" href="#kontakt">Upoznajte naš sistem <Arrow /></a>
          </div>
        </div>
        <div className="metrics reveal">
          <article>
            <strong>#1</strong>
            <span>Vodeća domaća pozicija</span>
            <p>U proizvodnji jaja i stočne hrane</p>
          </article>
          <article>
            <strong>360°</strong>
            <span>Podrška gazdinstvu</span>
            <p>Proizvodnja, program i stručna preporuka</p>
          </article>
          <article>
            <strong>B2B</strong>
            <span>Partnerstva koja traju</span>
            <p>Za trgovce, farme i institucionalne kupce</p>
          </article>
        </div>
      </section>

      <section className="production-story">
        <div className="production-visual reveal">
          <Image
            src="/images/agromont-hero.png"
            alt="Ilustrativni pogled na savremene silose i poljoprivredna polja"
            fill
            sizes="(max-width: 900px) 100vw, 58vw"
          />
          <div className="visual-badge">
            <span>Kontrolisan tok</span>
            <strong>Od sirovine do isporuke</strong>
          </div>
        </div>
        <div className="production-copy reveal">
          <div className="section-label light"><span>02</span> Proizvodnja</div>
          <h2>Kvalitet nije posljednja kontrola. On je svaki korak.</h2>
          <div className="process-list">
            {[
              ["01", "Odabir sirovina", "Provjereno porijeklo i stabilni standardi ulaza."],
              ["02", "Kontrolisana proizvodnja", "Precizni procesi, praćenje i odgovorno upravljanje."],
              ["03", "Pouzdana distribucija", "Od proizvodnje do partnera kroz organizovanu mrežu."],
            ].map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="catalogue section-pad" id="proizvodi">
        <div className="section-heading reveal">
          <div>
            <div className="section-label"><span>03</span> Naš program</div>
            <h2>Sve što pokreće dobro gazdinstvo.</h2>
          </div>
          <p>
            Pregled ključnih kategorija. Za cijenu, raspoloživost i preporuku obratite se najbližem centru.
          </p>
        </div>

        <div className="filters reveal" aria-label="Filtriranje proizvoda">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={activeFilter === filter.id ? "is-active" : ""}
              aria-pressed={activeFilter === filter.id}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="product-grid" aria-live="polite">
          {filteredProducts.map((product) => (
            <article className={`product-card product-${product.accent}`} key={product.id}>
              <div className="product-media">
                <Image
                  className="product-image"
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  unoptimized
                  sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1080px) 50vw, 33vw"
                />
                <div className="product-image-shade" aria-hidden="true" />
                <div className="product-top"><span>{product.eyebrow}</span><b>{product.index}</b></div>
              </div>
              <div className="product-copy">
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <a href="#kontakt" aria-label={`Pošaljite upit za ${product.title}`}>Pošaljite upit <Arrow /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="locations section-pad" id="lokacije">
        <div className="locations-intro reveal">
          <div className="section-label light"><span>04</span> Nađite nas</div>
          <h2>Centar vašeg sljedećeg koraka.</h2>
          <p>
            Izaberite lokaciju i pronađite program za farmu, baštu, domaćinstvo i održavanje.
          </p>
        </div>
        <div className="location-layout reveal">
          <div className="location-map" aria-label="Prikaz AgroMont lokacija u centralnoj Crnoj Gori">
            <iframe
              key={selectedLocation.id}
              className="location-map-frame"
              src={selectedLocation.mapEmbed}
              title={`Interaktivna mapa AgroMont centra ${selectedLocation.city}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
            <div className="map-active-card" aria-live="polite">
              <span>Aktivna lokacija</span>
              <strong>{selectedLocation.city}</strong>
            </div>
            <a
              className="map-provider-link"
              href={selectedLocation.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            >
              Otvori veću mapu <Arrow />
            </a>
          </div>
          <div className="location-panel">
            <div className="location-tabs" role="tablist" aria-label="AgroMont lokacije">
              {locations.map((location, index) => (
                <button
                  role="tab"
                  id={`location-tab-${location.id}`}
                  aria-controls="location-panel"
                  aria-selected={activeLocation === location.id}
                  tabIndex={activeLocation === location.id ? 0 : -1}
                  type="button"
                  key={location.id}
                  onClick={() => setActiveLocation(location.id)}
                  onKeyDown={(event) => selectLocationWithKeyboard(event, index)}
                >
                  {location.city}
                </button>
              ))}
            </div>
            <div className="location-detail" role="tabpanel" id="location-panel" aria-labelledby={`location-tab-${activeLocation}`}>
              <span>Aktivna lokacija</span>
              <h3>{selectedLocation.city}</h3>
              <strong>{selectedLocation.type}</strong>
              <p>{selectedLocation.description}</p>
              <div className="location-actions">
                <a href={`https://www.google.com/maps/search/?api=1&query=AgroMont+${selectedLocation.city}`} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Otvori mapu <Arrow /></a>
                <a href="#kontakt">Provjeri dostupnost</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="news section-pad" id="aktuelno">
        <div className="section-heading reveal">
          <div>
            <div className="section-label"><span>05</span> Aktuelno</div>
            <h2>Razlog više da svratite.</h2>
          </div>
          <a className="underline-link" href="https://www.instagram.com/agromont_doo/" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Pratite AgroMont <Arrow /></a>
        </div>
        <div className="news-grid">
          <article className="news-feature reveal">
            <div className="news-date"><span>Svakog mjeseca</span><strong>21—22</strong></div>
            <div className="news-feature-copy">
              <span>Za generacije koje su izgradile domaćinstva</span>
              <h3>5% za penzionere na žitarice i koncentrate.</h3>
              <p>Posebna pogodnost dostupna 21. i 22. svakog mjeseca u AgroMont centrima.</p>
              <a href="#lokacije">Pronađite centar <Arrow /></a>
            </div>
          </article>
          <article className="news-card reveal">
            <span className="news-tag">Sezonska ponuda</span>
            <div className="news-art news-art-grain" aria-hidden="true"><i /><i /><i /><i /></div>
            <h3>Vrijeme je za žetvu cijena.</h3>
            <p>Pratite aktuelne ponude žitarica, koncentrata i odabranog programa.</p>
            <a href="#kontakt">Provjerite ponudu <Arrow /></a>
          </article>
          <article className="news-card news-dark reveal">
            <span className="news-tag">Za poslovne kupce</span>
            <div className="news-art news-art-b2b" aria-hidden="true">B2B</div>
            <h3>Partnerstvo koje se prilagođava obimu.</h3>
            <p>Veleprodaja, kontinuirano snabdijevanje i podrška za farme i trgovce.</p>
            <a href="#kontakt">Započnimo razgovor <Arrow /></a>
          </article>
        </div>
      </section>

      <section className="careers section-pad" id="karijere">
        <div className="career-intro reveal">
          <div className="section-label light"><span>06</span> Karijere</div>
          <h2>Širimo tim.<br /><em>Rastimo zajedno.</em></h2>
          <p>
            Tražimo ljude koji razumiju tržište, poštuju proizvodnju i žele da naprave mjerljiv pomak.
          </p>
          <a className="button button-primary" href="mailto:agromont@agro.co.me?subject=Prijava%20za%20posao">Pošaljite CV <Arrow /></a>
        </div>
        <div className="jobs reveal">
          {[
            ["Marketing koordinator", "Jedna pozicija", "AgroMont sistem"],
            ["Agronom", "Više pozicija", "Golubovci / Tuzi"],
          ].map(([title, count, place], index) => (
            <a href={`mailto:agromont@agro.co.me?subject=Prijava%20-%20${encodeURIComponent(title)}`} key={title}>
              <span>0{index + 1}</span>
              <div><h3>{title}</h3><p>{count} · {place}</p></div>
              <Arrow />
            </a>
          ))}
          <div className="jobs-note">
            Ne vidite svoju poziciju? Pošaljite otvorenu prijavu na <a href="mailto:agromont@agro.co.me">agromont@agro.co.me</a>
          </div>
        </div>
      </section>

      <section className="contact section-pad" id="kontakt">
        <div className="contact-copy reveal">
          <div className="section-label"><span>07</span> Kontakt</div>
          <h2>Kako možemo da podržimo vaš rast?</h2>
          <p>Recite nam šta vam je potrebno. Povezaćemo vas sa pravim centrom ili članom tima.</p>
          <div className="contact-direct">
            <span>Direktan kontakt</span>
            <a href="mailto:agromont@agro.co.me">agromont@agro.co.me <Arrow /></a>
          </div>
        </div>
        <form className="contact-form reveal" onSubmit={submitForm} acceptCharset="UTF-8">
          <label className="website-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <div className="field-row">
            <label>Ime i prezime<input required name="name" autoComplete="name" placeholder="Vaše ime" minLength={2} maxLength={80} /></label>
            <label>Kompanija<input name="company" autoComplete="organization" placeholder="Naziv kompanije" maxLength={120} /></label>
          </div>
          <div className="field-row">
            <label>E-mail<input required name="email" type="email" autoComplete="email" inputMode="email" placeholder="ime@kompanija.me" maxLength={254} /></label>
            <label>Vrsta upita<select name="topic" defaultValue="proizvodi"><option value="proizvodi">Proizvodi i dostupnost</option><option value="b2b">B2B saradnja</option><option value="karijera">Karijera</option><option value="ostalo">Ostalo</option></select></label>
          </div>
          <label>Poruka<textarea required name="message" rows={4} placeholder="Opišite šta vam je potrebno…" minLength={10} maxLength={1200} /></label>
          <div className="form-bottom">
            <label className="consent"><input required type="checkbox" name="consent" /> <span>Saglasan/na sam da AgroMont obradi podatke radi odgovora na upit.</span></label>
            <button className="button button-dark" type="submit">Pošaljite upit <Arrow /></button>
          </div>
          {submitted && emailDraft && (
            <div className="form-success" role="status" aria-live="polite">
              <p>Upit je bezbjedno pripremljen. Podaci nijesu sačuvani niti poslati automatski.</p>
              <a href={emailDraft}>Otvorite e-mail aplikaciju <Arrow /></a>
            </div>
          )}
        </form>
      </section>

      <footer className="footer">
        <div className="footer-top">
          <Brand compact />
          <p>Proizvodnja. Program. Partnerstvo.<br />Sve što je potrebno da domaćinstvo raste.</p>
        </div>
        <div className="footer-links">
          <div><span>Navigacija</span><a href="#o-nama">O nama</a><a href="#proizvodi">Proizvodi</a><a href="#lokacije">Centri</a></div>
          <div><span>Kompanija</span><a href="#aktuelno">Aktuelno</a><a href="#karijere">Karijere</a><a href="#kontakt">Kontakt</a></div>
          <div><span>Povežite se</span><a href="https://www.instagram.com/agromont_doo/" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Instagram <Arrow /></a><a href="mailto:agromont@agro.co.me">E-mail <Arrow /></a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 AgroMont d.o.o.</span><span>Crna Gora · 42°26&apos;N 019°15&apos;E</span><a href="#vrh">Nazad na vrh ↑</a></div>
      </footer>
    </main>
  );
}
