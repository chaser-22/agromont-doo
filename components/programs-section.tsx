"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { productFilters, products } from "@/lib/site-data";
import { Arrow } from "./brand";

export function ProgramsSection() {
  const [activeFilter, setActiveFilter] = useState("sve");
  const visible = useMemo(
    () => activeFilter === "sve" ? products : products.filter((product) => product.category === activeFilter),
    [activeFilter],
  );

  return (
    <section className="programs section-pad" id="proizvodi">
      <div className="section-heading reveal">
        <div>
          <div className="section-label"><span>03</span> Naš program</div>
          <h2>Od proizvodnje do<br /><em>svakodnevnog rada.</em></h2>
        </div>
        <p>
          Jaja, stočna hrana, žitarice, oprema i program održavanja — pregledno organizovani prema stvarnim potrebama gazdinstava i partnera.
        </p>
      </div>

      <div className="filters reveal" role="group" aria-label="Filtriranje proizvoda">
        {productFilters.map((filter) => (
          <button
            type="button"
            key={filter.id}
            className={activeFilter === filter.id ? "is-active" : ""}
            aria-pressed={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            <span>{filter.label}</span>
          </button>
        ))}
      </div>

      <div className="program-grid" aria-live="polite">
        {visible.map((product, index) => (
          <article className="program-card reveal" key={product.id}>
            <div className="program-media">
              <Image
                src={product.image}
                alt={product.imageAlt}
                fill
                unoptimized
                sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 50vw, 33vw"
              />
              <div className="program-shade" aria-hidden="true" />
              <div className="program-number">{product.index}</div>
              <div className="program-eyebrow">{product.eyebrow}</div>
            </div>
            <div className="program-copy">
              <div>
                <span>0{index + 1} / {String(visible.length).padStart(2, "0")}</span>
                <h3>{product.title}</h3>
              </div>
              <p>{product.description}</p>
              <a href="#kontakt" aria-label={`Pošaljite upit za ${product.title}`}>
                Pošaljite upit <Arrow />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
