const nodes = [
  {
    code: "ME-01",
    place: "Spuž",
    role: "Stočna hrana",
    detail: "Industrijska veza između žitarica, farmi i tržišta.",
  },
  {
    code: "ME-02",
    place: "Martinići",
    role: "Farma / jaja",
    detail: "Proizvodnja i pakovanje konzumnih jaja u Crnoj Gori.",
  },
  {
    code: "ME-03",
    place: "Golubovci",
    role: "Poljoprivredni centar",
    detail: "Centar u Mojanovićima otvoren u avgustu 2025.",
  },
  {
    code: "ME-04",
    place: "Berane",
    role: "Poljoprivredni centar",
    detail: "Centar na sjeveru Crne Gore otvoren u julu 2025.",
  },
  {
    code: "RS-01",
    place: "Šabac / Kovin",
    role: "Žitarice",
    detail: "Otkupni centri sa 50.000 t ukupnog kapaciteta prema objavi iz 2025.",
  },
  {
    code: "BA-01",
    place: "Milići",
    role: "Regionalna proizvodnja",
    detail: "Preuzeti kompleks sa kapacitetom 400.000 koka nosilja prema objavi iz 2025.",
  },
] as const;

export function RegionalSystem() {
  return (
    <section className="regional-system" id="region" aria-labelledby="regional-system-title">
      <div className="regional-system-copy reveal">
        <span className="industrial-kicker">MREŽA / ME · RS · BA</span>
        <h2 id="regional-system-title">
          Proizvodnja ima lokaciju.
          <br />
          <em>Sistem ima domet.</em>
        </h2>
        <p>
          AGROMONT povezuje proizvodnju u Crnoj Gori sa nabavkom sirovine, regionalnim
          investicijama i poljoprivrednim centrima. Mreža ispod prikazuje poslovne tačke,
          ne navigacionu kartu.
        </p>
      </div>

      <div className="regional-system-board reveal" aria-label="Shematski prikaz AgroMont mreže">
        <svg className="regional-system-lines" viewBox="0 0 1000 540" aria-hidden="true">
          <path d="M115 310 C240 260 290 205 410 250 S630 335 740 260 S875 165 930 210" />
          <path d="M410 250 C390 360 480 420 585 386 S725 330 740 260" />
          <path d="M115 310 C160 390 250 445 350 420" />
        </svg>

        <div className="regional-origin" aria-hidden="true">
          <span>AGROMONT</span>
          <strong>PROIZVODNI SISTEM</strong>
        </div>

        <div className="regional-node-grid">
          {nodes.map((node, index) => (
            <article className="regional-node" key={node.code} style={{ "--node-index": index } as React.CSSProperties}>
              <span>{node.code}</span>
              <div>
                <small>{node.role}</small>
                <h3>{node.place}</h3>
                <p>{node.detail}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="regional-source-note">
          Kapaciteti i datumi su navedeni samo gdje postoje javno objavljeni podaci; promotivne
          objave kompanije nijesu predstavljene kao nezavisna revizija kapaciteta.
        </p>
      </div>
    </section>
  );
}
