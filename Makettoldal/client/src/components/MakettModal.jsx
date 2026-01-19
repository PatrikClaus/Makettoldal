import React, { useEffect, useState } from "react";
import CsillagValaszto from "./CsillagValaszto";
import VelemenyekSection from "./VelemenyekSection";

/**
 * Modal: nagy ablak egy maketthez
 * - mindig mutatja a kedvenc gombot
 * - opcionálisan mutat véleményeket is (showReviews)
 *
 * ADMIN:
 * - alapból csak "Szerkesztés" gomb látszik
 * - szerkesztés módba lépve jelenik meg a "Törlés" is
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

  // ✅ ÚJ: admin műveletek (szülő kezeli az API-t)
  onAdminUpdate, // async (id, payload) => updatedMakett
  onAdminDelete, // async (id) => void
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

  // ✅ Admin szerkesztés state
  const [szerkesztesNyitva, setSzerkesztesNyitva] = useState(false);
  const [mentesFolyamatban, setMentesFolyamatban] = useState(false);

  const [form, setForm] = useState({
    nev: "",
    gyarto: "",
    skala: "",
    kategoria: "",
    nehezseg: 1,
    megjelenes_eve: "",
    kep_url: "",
  });

  // amikor másik makettet nyitsz meg, reseteljük a szerkesztést és a formot
  useEffect(() => {
    if (!open || !makett) return;

    setSzerkesztesNyitva(false);
    setMentesFolyamatban(false);

    setForm({
      nev: makett.nev ?? "",
      gyarto: makett.gyarto ?? "",
      skala: makett.skala ?? "",
      kategoria: makett.kategoria ?? "",
      nehezseg: Number(makett.nehezseg ?? 1),
      megjelenes_eve: makett.megjelenes_eve ?? "",
      kep_url: makett.kep_url ?? "",
    });
  }, [open, makett]);

  if (!open || !makett) return null;

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function kezeliAdminMentes() {
    if (!onAdminUpdate) {
      alert("Hiányzik az onAdminUpdate handler a MakettModalból.");
      return;
    }

    try {
      setMentesFolyamatban(true);

      const payload = {
        nev: form.nev,
        gyarto: form.gyarto,
        skala: form.skala,
        kategoria: form.kategoria,
        nehezseg: Number(form.nehezseg),
        megjelenes_eve: form.megjelenes_eve,
        kep_url: form.kep_url,
      };

      await onAdminUpdate(makett.id ?? makett.makett_id, payload);

      // siker után kilépünk szerkesztés módból
      setSzerkesztesNyitva(false);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Hiba történt mentés közben.");
    } finally {
      setMentesFolyamatban(false);
    }
  }

  async function kezeliAdminTorles() {
    if (!onAdminDelete) {
      alert("Hiányzik az onAdminDelete handler a MakettModalból.");
      return;
    }

    if (!window.confirm("Biztosan törlöd ezt a makettet?")) return;

    try {
      setMentesFolyamatban(true);
      await onAdminDelete(makett.id ?? makett.makett_id);
      // törlés után zárjuk a modalt
      onClose?.();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Hiba történt törlés közben.");
    } finally {
      setMentesFolyamatban(false);
    }
  }

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

        {/* ===== GOMBOK ===== */}
        <div className="button-row">
          <button
            type="button"
            className={kedvenc ? "btn secondary" : "btn"}
            onClick={() => onToggleKedvenc?.(makett.id ?? makett.makett_id)}
          >
            {kedvenc ? "Kedvencekből eltávolítás" : "Kedvencekhez adás"}
          </button>

          {/* ✅ ADMIN: alapból csak a Szerkesztés látszik */}
          {isAdmin && !szerkesztesNyitva && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setSzerkesztesNyitva(true)}
            >
              Szerkesztés
            </button>
          )}

          <button type="button" className="btn secondary" onClick={onClose}>
            Bezárás
          </button>
        </div>

        {/* ===== ADMIN SZERKESZTÉS (csak ha megnyomta a szerkesztést) ===== */}
        {isAdmin && szerkesztesNyitva && (
          <section className="card form" style={{ marginTop: 12 }}>
            <h3>Makett szerkesztése</h3>

            <label>
              Név
              <input
                value={form.nev}
                onChange={(e) => setField("nev", e.target.value)}
              />
            </label>

            <label>
              Gyártó
              <input
                value={form.gyarto}
                onChange={(e) => setField("gyarto", e.target.value)}
              />
            </label>

            <label>
              Skála
              <input
                value={form.skala}
                onChange={(e) => setField("skala", e.target.value)}
              />
            </label>

            <label>
              Kategória
              <input
                value={form.kategoria}
                onChange={(e) => setField("kategoria", e.target.value)}
              />
            </label>

            <label>
              Nehézség (1–5)
              <input
                type="number"
                min={1}
                max={5}
                value={form.nehezseg}
                onChange={(e) => setField("nehezseg", e.target.value)}
              />
            </label>

            <label>
              Megjelenés éve
              <input
                value={form.megjelenes_eve}
                onChange={(e) => setField("megjelenes_eve", e.target.value)}
              />
            </label>

            <label>
              Kép URL
              <input
                value={form.kep_url}
                onChange={(e) => setField("kep_url", e.target.value)}
              />
            </label>

            <div className="button-row">
              <button
                type="button"
                className="btn"
                onClick={kezeliAdminMentes}
                disabled={mentesFolyamatban}
              >
                Mentés
              </button>

              <button
                type="button"
                className="btn secondary"
                onClick={() => setSzerkesztesNyitva(false)}
                disabled={mentesFolyamatban}
              >
                Mégse
              </button>

              {/* ✅ TÖRLÉS CSAK SZERKESZTÉS MÓDBAN JELENIK MEG */}
              <button
                type="button"
                className="btn danger"
                onClick={kezeliAdminTorles}
                disabled={mentesFolyamatban}
              >
                Törlés
              </button>
            </div>
          </section>
        )}

        {/* Vélemények */}
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
