import Image from "next/image";
import { Brand, Arrow } from "@/components/brand";
import { CareersSection, ContactSection } from "@/components/contact-careers";
import { IndustrialHero } from "@/components/industrial-hero";
import { LocationsSection } from "@/components/locations-section";
import { ProgramsSection } from "@/components/programs-section";
import { RevealController } from "@/components/reveal-controller";
import { SiteHeader } from "@/components/site-header";

const productionSteps = [
  {
    number: "01",
    eyebrow: "Ulaz",
    title: "Odabir sirovina",
    text: "Provjereno porijeklo i stabilni standardi ulaza postavljaju osnovu za svaki sljedeći korak.",
  },
  {
    number: "02",
    eyebrow: "Proces",
    title: "Kontrolisana proizvodnja",
    text: "Precizni procesi, praćenje i odgovorno upravljanje povezuju kvalitet sa ponovljivošću.",
  },
  {
    number: "03",
    eyebrow: "Izlaz",
    title: "Pouzdana distribucija",
    text: "Od proizvodnje do partnera kroz organizovanu mrežu centara i podršku pri izboru.",
  },
] as const;

export default function Home() {
  return (
    <main id="vrh">
      <a className="skip-link" href="#sadrzaj">Preskoči na sadržaj</a>
      <RevealController />
      <SiteHeader />
      <IndustrialHero />

      <section className="manifesto section-pad" id="o-nama">
        <div className="section-label reveal"><span>01</span> AgroMont danas</div>
        <div className="manifesto-grid">
          <h2 className="reveal">
            Od sigurnog porijekla<br />
            do <em>sigurnog izbora.</em>
          </h2>
          <div className="manifesto-copy reveal">
            <p className="lead">Proizvodnja, stručnost i dostupnost rade kao jedan sistem.</p>
            <p>
              AgroMont povezuje domaću proizvodnju jaja i stočne hrane sa pažljivo biranim programom za poljoprivredu, domaćinstvo i održavanje. Partner dobija pouzdan proizvod, jasan savjet i podršku kada mu je potrebna.
            </p>
            <a className="text-cta" href="#proizvodnja">Pogledajte kako sistem radi <Arrow /></a>
          </div>
        </div>

        <div className="metric-rail reveal">
          <article>
            <span>01 / PROIZVODNJA</span>
            <strong>#1</strong>
            <p>Vodeća domaća pozicija u proizvodnji jaja i stočne hrane</p>
          </article>
          <article>
            <span>02 / PODRŠKA</span>
            <strong>360°</strong>
            <p>Proizvodnja, program i stručna preporuka za gazdinstvo</p>
          </article>
          <article>
            <span>03 / PARTNERSTVO</span>
            <strong>B2B</strong>
            <p>Kontinuirano snabdijevanje za farme, trgovce i institucionalne kupce</p>
          </article>
        </div>
      </section>

      <section className="production-experience" id="proizvodnja">
        <div className="production-sticky">
          <div className="production-media">
            <Image
              src="/images/agromont-hero.png"
              alt="Ilustrativni pogled na savremene silose i poljoprivredna polja"
              fill
              sizes="(max-width: 900px) 100vw, 58vw"
            />
            <div className="production-media-shade" aria-hidden="true" />
            <div className="production-scan" aria-hidden="true" />
            <div className="production-coordinates" aria-hidden="true">
              <span>PROCESS / 001</span>
              <span>42.3436 N · 19.2183 E</span>
            </div>
            <div className="production-orbit" aria-hidden="true"><i /><i /><i /></div>
            <div className="production-caption">
              <span>Kontrolisan tok</span>
              <strong>Od sirovine<br />do isporuke.</strong>
            </div>
          </div>
        </div>

        <div className="production-copy">
          <div className="production-intro reveal">
            <div className="section-label light"><span>02</span> Proizvodnja</div>
            <h2>Kvalitet nije posljednja kontrola.<br /><em>On je svaki korak.</em></h2>
            <p>Tri faze jednog sistema, povezane od ulaza sirovine do partnera.</p>
          </div>
          <div className="production-steps">
            {productionSteps.map((step) => (
              <article className="production-step reveal" key={step.number}>
                <span className="production-step-number">{step.number}</span>
                <div>
                  <span className="production-step-eyebrow">{step.eyebrow}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProgramsSection />
      <LocationsSection />

      <section className="signals section-pad" id="aktuelno">
        <div className="section-heading reveal">
          <div>
            <div className="section-label"><span>05</span> Aktuelno</div>
            <h2>Razlog više<br /><em>da svratite.</em></h2>
          </div>
          <a className="text-cta" href="https://www.instagram.com/agromont_doo/" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
            Pratite AgroMont <Arrow />
          </a>
        </div>

        <div className="signal-grid">
          <article className="signal-feature reveal">
            <div className="signal-top">
              <span>Svakog mjeseca</span>
              <strong>21—22</strong>
            </div>
            <div className="signal-copy">
              <span>Za generacije koje su izgradile domaćinstva</span>
              <h3>5% za penzionere na žitarice i koncentrate.</h3>
              <p>Posebna pogodnost dostupna 21. i 22. svakog mjeseca u AgroMont centrima.</p>
              <a href="#lokacije">Pronađite centar <Arrow /></a>
            </div>
          </article>

          <article className="signal-b2b reveal">
            <div className="b2b-mark" aria-hidden="true">B2B</div>
            <span>Za poslovne kupce</span>
            <h3>Partnerstvo koje se prilagođava obimu.</h3>
            <p>Veleprodaja, kontinuirano snabdijevanje i podrška za farme i trgovce.</p>
            <a href="#kontakt">Započnimo razgovor <Arrow /></a>
          </article>
        </div>
      </section>

      <CareersSection />
      <ContactSection />

      <footer className="footer">
        <div className="footer-top">
          <Brand compact />
          <p>Proizvodnja. Program. Partnerstvo.<br />Sve što je potrebno da domaćinstvo raste.</p>
        </div>
        <div className="footer-links">
          <div>
            <span>Navigacija</span>
            <a href="#o-nama">O nama</a>
            <a href="#proizvodnja">Proizvodnja</a>
            <a href="#proizvodi">Program</a>
          </div>
          <div>
            <span>Kompanija</span>
            <a href="#lokacije">Centri</a>
            <a href="#aktuelno">Aktuelno</a>
            <a href="#karijere">Karijere</a>
          </div>
          <div>
            <span>Povežite se</span>
            <a href="https://www.instagram.com/agromont_doo/" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Instagram <Arrow /></a>
            <a href="mailto:agromont@agro.co.me">E-mail <Arrow /></a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 AgroMont d.o.o.</span>
          <span>Crna Gora · 42°26&apos;N 019°15&apos;E</span>
          <a href="#vrh">Nazad na vrh ↑</a>
        </div>
      </footer>
    </main>
  );
}
