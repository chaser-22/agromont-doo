"use client";

import { FormEvent, useRef, useState } from "react";
import { Arrow } from "./brand";

function cleanFormValue(data: FormData, field: string, maxLength: number) {
  return Array.from(String(data.get(field) ?? ""))
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function CareersSection() {
  const [careerPosition, setCareerPosition] = useState("Otvorena prijava");
  const [careerDraft, setCareerDraft] = useState<string | null>(null);
  const [careerFileName, setCareerFileName] = useState("");
  const [careerError, setCareerError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  const openDialog = (position = "Otvorena prijava") => {
    setCareerPosition(position);
    setCareerDraft(null);
    setCareerFileName("");
    setCareerError("");
    requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (!dialog.open) dialog.showModal();
      dialog.querySelector<HTMLInputElement>("input[name='candidateName']")?.focus();
    });
  };

  const closeDialog = () => {
    dialogRef.current?.close();
    requestAnimationFrame(() => openButtonRef.current?.focus());
  };

  const submitCareer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const fileInput = form.elements.namedItem("cv") as HTMLInputElement;
    const file = fileInput.files?.[0];
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!file || !/\.(pdf|doc|docx)$/i.test(file.name) || (file.type && !allowedTypes.includes(file.type))) {
      setCareerError("Izaberite CV u PDF, DOC ili DOCX formatu.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCareerError("CV može imati najviše 5 MB.");
      return;
    }

    const name = cleanFormValue(data, "candidateName", 80);
    const email = cleanFormValue(data, "candidateEmail", 254);
    const phone = cleanFormValue(data, "candidatePhone", 40);
    const note = cleanFormValue(data, "candidateNote", 600);
    const position = cleanFormValue(data, "position", 80) || careerPosition;
    const body = [
      `Ime i prezime: ${name}`,
      `E-mail: ${email}`,
      `Telefon: ${phone || "Nije naveden"}`,
      `Pozicija: ${position}`,
      `CV za prilog: ${file.name}`,
      "",
      note ? `Kratka poruka:\r\n${note}` : "",
      "",
      `Molim vas priložite datoteku „${file.name}” ovom e-mailu prije slanja.`,
    ].filter(Boolean).join("\r\n");

    setCareerError("");
    setCareerFileName(file.name);
    setCareerDraft(
      `mailto:agromont@agro.co.me?subject=${encodeURIComponent(`Prijava za posao — ${position}`)}&body=${encodeURIComponent(body)}`,
    );
  };

  const jobs = [
    ["Marketing koordinator", "Jedna pozicija", "AgroMont sistem"],
    ["Agronom", "Više pozicija", "Golubovci / Tuzi"],
  ] as const;

  return (
    <>
      <section className="careers section-pad" id="karijere">
        <div className="career-copy reveal">
          <div className="section-label light"><span>06</span> Karijere</div>
          <h2>Širimo tim.<br /><em>Rastimo zajedno.</em></h2>
          <p>Tražimo ljude koji razumiju tržište, poštuju proizvodnju i žele da naprave mjerljiv pomak.</p>
          <button ref={openButtonRef} className="button button-primary" type="button" onClick={() => openDialog()}>
            Pošaljite CV <Arrow />
          </button>
        </div>

        <div className="jobs reveal">
          {jobs.map(([title, count, place], index) => (
            <button type="button" onClick={() => openDialog(title)} key={title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{count} · {place}</p>
              </div>
              <Arrow />
            </button>
          ))}
          <p className="jobs-note">
            Ne vidite svoju poziciju? Pošaljite otvorenu prijavu na{" "}
            <a href="mailto:agromont@agro.co.me">agromont@agro.co.me</a>
          </p>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        className="career-dialog"
        aria-labelledby="career-dialog-title"
        onClose={() => setCareerDraft(null)}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
      >
        <div className="career-dialog-head">
          <div>
            <span>Karijere · AgroMont</span>
            <h2 id="career-dialog-title">Pošaljite CV</h2>
          </div>
          <button type="button" className="dialog-close" aria-label="Zatvorite prijavu" onClick={closeDialog}>×</button>
        </div>
        <form className="career-form" onSubmit={submitCareer} acceptCharset="UTF-8">
          <div className="field-row">
            <label>Ime i prezime<input required name="candidateName" autoComplete="name" minLength={2} maxLength={80} /></label>
            <label>E-mail<input required name="candidateEmail" type="email" autoComplete="email" inputMode="email" maxLength={254} /></label>
          </div>
          <div className="field-row">
            <label>Telefon<input name="candidatePhone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} /></label>
            <label>Pozicija
              <select name="position" value={careerPosition} onChange={(event) => setCareerPosition(event.target.value)}>
                <option>Otvorena prijava</option>
                <option>Marketing koordinator</option>
                <option>Agronom</option>
              </select>
            </label>
          </div>
          <label>CV dokument
            <input
              required
              name="cv"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={() => {
                setCareerDraft(null);
                setCareerError("");
              }}
            />
            <small>PDF, DOC ili DOCX · najviše 5 MB</small>
          </label>
          <label>Kratka poruka<textarea name="candidateNote" rows={3} maxLength={600} placeholder="Recite nam ukratko zašto želite da se pridružite timu…" /></label>
          <label className="consent"><input required type="checkbox" name="careerConsent" /> <span>Saglasan/na sam da AgroMont obradi podatke iz prijave radi selekcije kandidata.</span></label>
          {careerError && <p className="career-error" role="alert">{careerError}</p>}
          {!careerDraft ? (
            <button className="button button-primary" type="submit">Pripremite prijavu <Arrow /></button>
          ) : (
            <div className="career-ready" role="status" aria-live="polite">
              <p>Prijava je pripremljena. U e-mail aplikaciji obavezno priložite <strong>{careerFileName}</strong>.</p>
              <a className="button button-primary" href={careerDraft}>Otvorite e-mail i priložite CV <Arrow /></a>
            </div>
          )}
        </form>
      </dialog>
    </>
  );
}

export function ContactSection() {
  const [emailDraft, setEmailDraft] = useState<string | null>(null);

  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (cleanFormValue(data, "website", 80)) return;

    const name = cleanFormValue(data, "name", 80);
    const company = cleanFormValue(data, "company", 120);
    const email = cleanFormValue(data, "email", 254);
    const message = cleanFormValue(data, "message", 1200);
    const requestedTopic = cleanFormValue(data, "topic", 20);
    const topics: Record<string, string> = {
      proizvodi: "Proizvodi i dostupnost",
      b2b: "B2B saradnja",
      karijera: "Karijera",
      ostalo: "Ostalo",
    };
    const topic = topics[requestedTopic] ?? topics.ostalo;
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
      `mailto:agromont@agro.co.me?subject=${encodeURIComponent(`AgroMont upit — ${topic}`)}&body=${encodeURIComponent(body)}`,
    );
    form.reset();
  };

  return (
    <section className="contact section-pad" id="kontakt">
      <div className="contact-copy reveal">
        <div className="section-label"><span>07</span> Kontakt</div>
        <h2>Recite nam<br /><em>šta treba da raste.</em></h2>
        <p>Povezaćemo vas sa pravim centrom ili članom tima za proizvod, dostupnost, B2B saradnju ili drugo pitanje.</p>
        <div className="contact-direct">
          <span>Direktan kontakt</span>
          <a href="mailto:agromont@agro.co.me">agromont@agro.co.me <Arrow /></a>
        </div>
      </div>

      <form className="contact-form reveal" onSubmit={submitContact} acceptCharset="UTF-8">
        <label className="website-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <div className="field-row">
          <label>Ime i prezime<input required name="name" autoComplete="name" placeholder="Vaše ime" minLength={2} maxLength={80} /></label>
          <label>Kompanija<input name="company" autoComplete="organization" placeholder="Naziv kompanije" maxLength={120} /></label>
        </div>
        <div className="field-row">
          <label>E-mail<input required name="email" type="email" autoComplete="email" inputMode="email" placeholder="ime@kompanija.me" maxLength={254} /></label>
          <label>Vrsta upita
            <select name="topic" defaultValue="proizvodi">
              <option value="proizvodi">Proizvodi i dostupnost</option>
              <option value="b2b">B2B saradnja</option>
              <option value="karijera">Karijera</option>
              <option value="ostalo">Ostalo</option>
            </select>
          </label>
        </div>
        <label>Poruka<textarea required name="message" rows={4} placeholder="Opišite šta vam je potrebno…" minLength={10} maxLength={1200} /></label>
        <div className="form-bottom">
          <label className="consent"><input required type="checkbox" name="consent" /> <span>Saglasan/na sam da AgroMont obradi podatke radi odgovora na upit.</span></label>
          <button className="button button-dark" type="submit">Pripremite upit <Arrow /></button>
        </div>
        {emailDraft && (
          <div className="form-success" role="status" aria-live="polite">
            <p>Upit je pripremljen. Podaci nijesu sačuvani niti poslati automatski.</p>
            <a href={emailDraft}>Otvorite e-mail aplikaciju <Arrow /></a>
          </div>
        )}
      </form>
    </section>
  );
}
