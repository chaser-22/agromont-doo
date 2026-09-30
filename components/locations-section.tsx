"use client";

import { KeyboardEvent as ReactKeyboardEvent, useMemo, useState } from "react";
import { locations } from "@/lib/site-data";
import { Arrow } from "./brand";

export function LocationsSection() {
  const [activeLocation, setActiveLocation] = useState<(typeof locations)[number]["id"]>("golubovci");
  const selected = useMemo(
    () => locations.find((location) => location.id === activeLocation) ?? locations[0],
    [activeLocation],
  );

  const onTabKey = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowLeft") next = (index - 1 + locations.length) % locations.length;
    if (event.key === "ArrowRight") next = (index + 1) % locations.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = locations.length - 1;
    const location = locations[next];
    setActiveLocation(location.id);
    requestAnimationFrame(() => document.getElementById(`location-tab-${location.id}`)?.focus());
  };

  return (
    <section className="locations section-pad" id="lokacije">
      <div className="location-head reveal">
        <div>
          <div className="section-label light"><span>05</span> AgroMont centri</div>
          <h2>Program i podrška.<br /><em>Bliže gazdinstvu.</em></h2>
        </div>
        <p>Program za farmu, baštu, domaćinstvo i održavanje, uz podršku pri izboru.</p>
      </div>

      <div className="location-stage reveal">
        <div className="location-map">
          {selected.mapEmbed ? (
            <iframe
              key={selected.id}
              src={selected.mapEmbed}
              title={`Interaktivna mapa AgroMont centra ${selected.city}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          ) : (
            <div className="location-map-placeholder">
              <span>LOKACIJA / {selected.city.toUpperCase()}</span>
              <strong>Centar je javno potvrđen.</strong>
              <p>Precizan marker nije postavljen dok se adresa ne potvrdi iz direktnog izvora.</p>
            </div>
          )}
          <div className="location-crosshair" aria-hidden="true"><i /><i /></div>
          <div className="map-caption" aria-live="polite">
            <span>Aktivna lokacija</span>
            <strong>{selected.city}</strong>
          </div>
        </div>

        <div className="location-console">
          <div className="location-tabs" role="tablist" aria-label="AgroMont lokacije">
            {locations.map((location, index) => (
              <button
                key={location.id}
                id={`location-tab-${location.id}`}
                role="tab"
                type="button"
                aria-selected={selected.id === location.id}
                aria-controls="location-panel"
                tabIndex={selected.id === location.id ? 0 : -1}
                onClick={() => setActiveLocation(location.id)}
                onKeyDown={(event) => onTabKey(event, index)}
              >
                <span>0{index + 1}</span>
                {location.city}
              </button>
            ))}
          </div>

          <div id="location-panel" className="location-detail" role="tabpanel" aria-labelledby={`location-tab-${selected.id}`}>
            <span className="location-status"><i /> Otvorena lokacija</span>
            <h3>{selected.city}</h3>
            <strong>{selected.type}</strong>
            <small className="location-address">{selected.address}</small>
            <p>{selected.description}</p>
            <div className="location-actions">
              <a href={selected.mapLink} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                Otvori mapu <Arrow />
              </a>
              <a href="#kontakt">Provjeri dostupnost <Arrow /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
