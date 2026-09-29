import Image from "next/image";

export function Arrow() {
  return <span className="arrow-icon" aria-hidden="true" />;
}

export function Brand({
  compact = false,
  textOnly = false,
}: {
  compact?: boolean;
  textOnly?: boolean;
}) {
  return (
    <a
      className={`brand ${compact ? "brand-compact" : ""} ${textOnly ? "brand-text-only" : ""}`}
      href="#vrh"
      aria-label="AgroMont — početna"
    >
      {!textOnly && (
        <span className="brand-logo-frame" aria-hidden="true">
          <Image
            className="brand-logo-image"
            src="/images/agromont-logo.jpg"
            alt=""
            width={1080}
            height={1350}
            sizes="(max-width: 760px) 96px, 112px"
            priority={!compact}
          />
        </span>
      )}
      {(!compact || textOnly) && <span className="brand-wordmark">AGROMONT</span>}
    </a>
  );
}
