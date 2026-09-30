import { Arrow, Brand } from "@/components/brand";
import { CareersSection, ContactSection } from "@/components/contact-careers";
import { LocationsSection } from "@/components/locations-section";
import { ProgramsSection } from "@/components/programs-section";
import { RegionalSystem } from "@/components/regional-system";
import { RevealController } from "@/components/reveal-controller";
import { SiteHeader } from "@/components/site-header";
import { SupplyChainExperience } from "@/components/supply-chain-experience";

const operatingFacts = [
  {
    code: "01",
    value: "50.000 t",
    label: "Šabac + Kovin",
    detail: "Ukupni kapacitet otkupnih centara žitarica prema promotivnoj objavi iz 2025.",
  },
  {
    code: "02",
    value: "Spuž",
    label: "Stočna hrana",
    detail: "Proizvodnja koja povezuje sirovinu sa farmama i tržištem.",
  },
  {
    code: "03",
    value: "400.000",
    label: "Milići",
    detail: "Kapacitet koka nosilja u preuzetom kompleksu prema promotivnoj objavi iz 2025.",
  },
  {
    code: "04",
    value: "2025",
    label: "Berane + Golubovci",
    detail: "Godina otvaranja novih poljoprivrednih centara potvrđena javnim objavama.",
  },
] as const;

export default function Home() {
  return (
    <main id="vrh" className="r26 lsc">
      <a className="skip-link" href="#sadrzaj">Preskoči na sadržaj</a>
      <RevealController />
      <SiteHeader />

      <div id="sadrzaj">
        <SupplyChainExperience />

        <section className="system-proof section-pad" id="o-nama" aria-labelledby="system-proof-title">
          <div className="system-proof-intro reveal">
            <span className="industrial-kicker">SISTEM / INFRASTRUKTURA / TRŽIŠTE</span>
            <h2 id="system-proof-title">
              Nije jedna farma.
              <br />
              <em>Nije jedna fabrika.</em>
            </h2>
            <p>
              AGROMONT povezuje žitarice, stočnu hranu, živinarsku proizvodnju, sortiranje,
              pakovanje, distribuciju i poljoprivredne centre. Vrijednost sistema je u vezi
              između tih tačaka.
            </p>
          </div>

          <div className="system-proof-facts">
            {operatingFacts.map((fact) => (
              <article className="system-proof-fact reveal" key={fact.code}>
                <span>{fact.code}</span>
                <strong>{fact.value}</strong>
                <h3>{fact.label}</h3>
                <p>{fact.detail}</p>
              </article>
            ))}
          </div>

          <div className="system-proof-note reveal">
            <span>METODOLOGIJA</span>
            <p>
              Vizuelni prikaz proizvodnje je autorska interpretacija poslovnog sistema, a ne
              tehnički nacrt konkretne fabrike. Kapaciteti se navode samo tamo gdje postoje
              javno objavljeni podaci i zadržavaju kontekst izvora.
            </p>
          </div>
        </section>

        <section className="industrial-statement reveal" aria-label="AgroMont pozicioniranje">
          <span>OD MATERIJALA DO TRŽIŠTA</span>
          <h2>
            Fizička infrastruktura
            <br />
            postaje <em>poslovna mreža.</em>
          </h2>
          <a href="#region">Pogledajte regionalni sistem <Arrow /></a>
        </section>

        <RegionalSystem />

        <ProgramsSection />
        <LocationsSection />
        <CareersSection />
        <ContactSection />
      </div>

      <footer className="footer r26-footer lsc-footer">
        <div className="footer-top">
          <Brand textOnly />
          <p>
            Žitarice. Hrana. Farma. Sortiranje. Distribucija.
            <br />
            Jedan sistem od materijala do tržišta.
          </p>
        </div>
        <div className="footer-links">
          <div>
            <span>Sistem</span>
            <a href="#proizvodnja">Proizvodni tok</a>
            <a href="#o-nama">Infrastruktura</a>
            <a href="#region">Regionalna mreža</a>
          </div>
          <div>
            <span>Program</span>
            <a href="#proizvodi">Proizvodi</a>
            <a href="#lokacije">Centri</a>
            <a href="#karijere">Karijere</a>
          </div>
          <div>
            <span>Kontakt</span>
            <a href="https://www.instagram.com/agromont_doo/" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
              Instagram <Arrow />
            </a>
            <a href="mailto:agromont@agro.co.me">agromont@agro.co.me <Arrow /></a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 AgroMont d.o.o.</span>
          <span>Crna Gora · regionalni poljoprivredno-industrijski sistem</span>
          <a href="#vrh">Nazad na vrh ↑</a>
        </div>
      </footer>
    </main>
  );
}
