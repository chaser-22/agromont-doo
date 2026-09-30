import type { CSSProperties } from "react";
import { Brand, Arrow } from "@/components/brand";
import { CareersSection, ContactSection } from "@/components/contact-careers";
import { LocationsSection } from "@/components/locations-section";
import { MaterialJourney } from "@/components/material-journey";
import { ProgramsSection } from "@/components/programs-section";
import { RevealController } from "@/components/reveal-controller";
import { SiteHeader } from "@/components/site-header";

const systemFacts = [
  {
    label: "Otkup žitarica",
    value: "50.000 t",
    detail: "zajednički kapacitet centara u Šapcu i Kovinu objavljen 2025.",
  },
  {
    label: "Spuž",
    value: "Stočna hrana",
    detail: "proizvodnja koja povezuje sirovinu sa potrebama farmi i tržišta",
  },
  {
    label: "Milići",
    value: "400.000",
    detail: "koka nosilja — kapacitet preuzetog kompleksa prema objavi iz 2025.",
  },
] as const;

const timeline = [
  ["Martinići", "Farma", "Proizvodnja i pakovanje konzumnih jaja u Crnoj Gori."],
  ["Spuž", "Fabrika", "Stočna hrana kao industrijska veza između žitarica i farmi."],
  ["Šabac / Kovin", "Žitarice", "Regionalni otkupni centri i veća kontrola ulaza u lanac."],
  ["Milići", "Regionalni rast", "Veliki kompleks za proizvodnju jaja preuzet 2025. godine."],
] as const;

export default function Home() {
  return (
    <main id="vrh" className="r26">
      <a className="skip-link" href="#sadrzaj">Preskoči na sadržaj</a>
      <RevealController />
      <SiteHeader />

      <div id="sadrzaj">
        <MaterialJourney />

        <section className="r26-proof section-pad" id="o-nama" aria-labelledby="proof-title">
          <div className="r26-proof-head reveal">
            <div className="section-label"><span>01</span> Sistem, ne slogan</div>
            <h2 id="proof-title">
              AgroMont se najbolje razumije <em>kao povezan lanac.</em>
            </h2>
            <p>
              Kompanija povezuje ulazne sirovine, proizvodnju stočne hrane, farme, pakovanje,
              distribuciju i prodajne centre. Regionalno širenje dodatno pojačava tu logiku.
            </p>
          </div>

          <div className="r26-fact-grid">
            {systemFacts.map((fact, index) => (
              <article className="r26-fact reveal" key={fact.label}>
                <span>0{index + 1} / PODATAK</span>
                <strong>{fact.value}</strong>
                <h3>{fact.label}</h3>
                <p>{fact.detail}</p>
              </article>
            ))}
          </div>

          <div className="r26-source-note reveal">
            <span>Napomena</span>
            <p>
              Brojke iznad su predstavljene samo tamo gdje postoje javno objavljeni podaci.
              Vizuelni 3D tok je autorska interpretacija proizvodnog lanca, ne tehnički nacrt konkretne fabrike.
            </p>
          </div>
        </section>

        <section className="r26-network" aria-labelledby="network-title">
          <div className="r26-network-sticky">
            <div className="r26-network-head reveal">
              <div className="section-label light"><span>02</span> Regionalni sistem</div>
              <h2 id="network-title">Četiri tačke.<br /><em>Jedna logika.</em></h2>
            </div>

            <div className="r26-route" aria-hidden="true">
              <i />
              {timeline.map((item, index) => (
                <span key={item[0]} style={{ "--route-index": index } as CSSProperties}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                </span>
              ))}
            </div>
          </div>

          <div className="r26-network-list">
            {timeline.map(([place, type, description], index) => (
              <article className="r26-network-item reveal" key={place}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <small>{type}</small>
                  <h3>{place}</h3>
                </div>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="r26-bridge section-pad reveal" aria-label="AgroMont pozicioniranje">
          <p>PROIZVODNJA / PAKOVANJE / DISTRIBUCIJA</p>
          <h2>
            Fizička infrastruktura je brend.
            <br />
            <em>Ne pozadina.</em>
          </h2>
          <a href="#proizvodi">Istražite program <Arrow /></a>
        </section>

        <ProgramsSection />
        <LocationsSection />

        <section className="r26-regional section-pad" id="aktuelno">
          <div className="r26-regional-copy reveal">
            <div className="section-label"><span>05</span> Širi kontekst</div>
            <h2>Iz Crne Gore.<br /><em>Povezano sa regionom.</em></h2>
            <p>
              Javno objavljeni razvoj uključuje otkupne centre žitarica u Srbiji i preuzimanje
              velike farme u Milićima 2025. godine. To mijenja sliku AgroMonta: sa lokalnog
              proizvođača na regionalno povezan sistem hrane i poljoprivrede.
            </p>
          </div>
          <div className="r26-regional-mark reveal" aria-hidden="true">
            <span>ME</span>
            <i />
            <span>RS</span>
            <i />
            <span>BA</span>
          </div>
        </section>

        <CareersSection />
        <ContactSection />
      </div>

      <footer className="footer r26-footer">
        <div className="footer-top">
          <Brand compact />
          <p>
            Žitarice. Hrana. Farma. Distribucija.
            <br />
            Jedan sistem koji povezuje proizvodnju i tržište.
          </p>
        </div>
        <div className="footer-links">
          <div>
            <span>Sistem</span>
            <a href="#o-nama">O AgroMontu</a>
            <a href="#proizvodnja">Proizvodni tok</a>
            <a href="#proizvodi">Program</a>
          </div>
          <div>
            <span>Mreža</span>
            <a href="#lokacije">Centri</a>
            <a href="#aktuelno">Region</a>
            <a href="#karijere">Karijere</a>
          </div>
          <div>
            <span>Kontakt</span>
            <a href="https://www.instagram.com/agromont_doo/" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Instagram <Arrow /></a>
            <a href="mailto:agromont@agro.co.me">agromont@agro.co.me <Arrow /></a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 AgroMont d.o.o.</span>
          <span>Crna Gora · regionalni poljoprivredni sistem</span>
          <a href="#vrh">Nazad na vrh ↑</a>
        </div>
      </footer>
    </main>
  );
}
