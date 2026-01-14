import React, { useEffect } from "react";
import CsillagValaszto from "./CsillagValaszto";
import VelemenyekSection from "./VelemenyekSection";

/**
 * Modal: nagy ablak egy maketthez
 * - mindig mutatja a kedvenc gombot
 * - opcionálisan mutat véleményeket is (showReviews)
 */
export default function MakettModal({
  open,
  makett,
  onClose,

  atlag = 0,
  velemenyek = [],
  kedvenc = false,
  onToggleKedvenc,

  showReviews = true,

  bejelentkezve,
  felhasznalo,
  isAdmin,
  formatDatum,
  hozzaadVelemeny,
  modositVelemeny,
  torolVelemeny,
}) {
  // háttér scroll tiltás
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  // ESC zárás
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !makett) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{makett.nev}</h2>
            <p className="small">
              {makett.gyarto} • {makett.skala} • {makett.kategoria}
            </p>

            <div className="makett-ertekeles">
              <CsillagValaszto value={atlag} readOnly />
              <p className="small">
                Átlag: {Number(atlag).toFixed(1)} ({velemenyek.length} vélemény)
              </p>
            </div>
          </div>

          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {makett.kep_url && (
          <img className="modal-kep" src={makett.kep_url} alt={makett.nev} />
        )}

        <div className="modal-grid">
          <p className="small">
            <strong>Nehézség:</strong> {makett.nehezseg}/5
          </p>
          <p className="small">
            <strong>Megjelenés éve:</strong> {makett.megjelenes_eve}
          </p>
        </div>

        <div className="button-row">
          <button
            type="button"
            className={kedvenc ? "btn secondary" : "btn"}
            onClick={() => onToggleKedvenc?.(makett.id ?? makett.makett_id)}
          >
            {kedvenc ? "Kedvencekből eltávolítás" : "Kedvencekhez adás"}
          </button>

          <button type="button" className="btn secondary" onClick={onClose}>
            Bezárás
          </button>
        </div>

        {showReviews && (
          <VelemenyekSection
            makettId={makett.id}
            velemenyek={velemenyek}
            bejelentkezve={bejelentkezve}
            felhasznalo={felhasznalo}
            isAdmin={isAdmin}
            formatDatum={formatDatum}
            hozzaadVelemeny={hozzaadVelemeny}
            modositVelemeny={modositVelemeny}
            torolVelemeny={torolVelemeny}
          />
        )}
      </div>
    </div>
  );
}
