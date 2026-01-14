import React, { useState } from "react";
import { Link } from "react-router-dom";
import CsillagValaszto from "./CsillagValaszto";

/**
 * Közös vélemény blokk (kártyában és modalban is ugyanazt használjuk)
 */
export default function VelemenyekSection({
  makettId,
  velemenyek = [],
  bejelentkezve,
  felhasznalo,
  isAdmin,
  formatDatum,

  hozzaadVelemeny,
  modositVelemeny,
  torolVelemeny,
}) {
  // Új vélemény state (külön a komponensen belül)
  const [ujSzoveg, setUjSzoveg] = useState("");
  const [ujErtekeles, setUjErtekeles] = useState(5);

  // Szerkesztés state (külön a komponensen belül)
  const [szerkesztettId, setSzerkesztettId] = useState(null);
  const [szerkSzoveg, setSzerkSzoveg] = useState("");
  const [szerkErtekeles, setSzerkErtekeles] = useState(5);

  function velemenySzerzoSajat(v) {
    if (!felhasznalo || !v) return false;
    return (
      v.felhasznalo_id === felhasznalo.id ||
      v.felhasznaloId === felhasznalo.id
    );
  }

  function szerkesztesIndit(v) {
    setSzerkesztettId(v.id);
    setSzerkSzoveg(v.szoveg || "");
    setSzerkErtekeles(v.ertekeles || 5);
  }

  async function szerkesztesMentes(e) {
    e.preventDefault();
    if (!szerkesztettId) return;

    try {
      await modositVelemeny(szerkesztettId, {
        szoveg: szerkSzoveg,
        ertekeles: Number(szerkErtekeles),
      });
      setSzerkesztettId(null);
    } catch (err) {
      console.error("Vélemény módosítási hiba:", err);
      alert("Hiba történt a vélemény módosításakor.");
    }
  }

  async function torles(id) {
    if (!window.confirm("Biztosan törlöd ezt a véleményt?")) return;
    try {
      await torolVelemeny(id);
    } catch (err) {
      console.error("Vélemény törlési hiba:", err);
      alert("Hiba történt a vélemény törlésekor.");
    }
  }

  async function ujKuldes(e) {
    e.preventDefault();
    try {
      await hozzaadVelemeny(makettId, {
        szoveg: ujSzoveg,
        ertekeles: Number(ujErtekeles),
      });
      setUjSzoveg("");
      setUjErtekeles(5);
    } catch (err) {
      console.error("Vélemény mentési hiba:", err);
      alert("Hiba történt a vélemény mentésekor.");
    }
  }

  return (
    <section className="velemenyek-szekcio">
      <h3>Vélemények</h3>

      {velemenyek.length === 0 ? (
        <p>Még nem érkezett vélemény ehhez a maketthez.</p>
      ) : (
        <ul className="velemeny-lista">
          {velemenyek.map((v) => {
            const szerzoSajat = velemenySzerzoSajat(v);
            const szerkesztheto = szerzoSajat || isAdmin;

            // Szerkesztő nézet
            if (szerkesztettId === v.id) {
              return (
                <li key={v.id} className="card velemeny-card">
                  <form onSubmit={szerkesztesMentes} className="form">
                    <h4>Vélemény szerkesztése</h4>

                    <label>
                      Értékelés (1–5)
                      <CsillagValaszto
                        value={szerkErtekeles}
                        onChange={(e) => setSzerkErtekeles(e)}
                      />
                    </label>

                    <label>
                      Vélemény szövege
                      <textarea
                        value={szerkSzoveg}
                        onChange={(e) => setSzerkSzoveg(e.target.value)}
                        rows={4}
                        required
                      />
                    </label>

                    <div className="button-row">
                      <button type="submit" className="btn">
                        Mentés
                      </button>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => setSzerkesztettId(null)}
                      >
                        Mégse
                      </button>
                    </div>
                  </form>
                </li>
              );
            }

            // Normál nézet
            return (
              <li key={v.id} className="card velemeny-card">
                <header className="velemeny-fejlec">
                  <div>
                    <strong>{v.felhasznalo_nev}</strong>
                    <p className="small">{formatDatum?.(v.letrehozva) || ""}</p>
                  </div>
                  <div>
                    <CsillagValaszto value={v.ertekeles} readOnly />
                  </div>
                </header>

                <p>{v.szoveg}</p>

                {szerkesztheto && (
                  <div className="button-row">
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => szerkesztesIndit(v)}
                    >
                      Szerkesztés
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => torles(v.id)}
                    >
                      Törlés
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Új vélemény */}
      {bejelentkezve ? (
        <form onSubmit={ujKuldes} className="card form">
          <h3>Új vélemény írása</h3>

          <label>
            Értékelés (1–5)
            <CsillagValaszto value={ujErtekeles} onChange={setUjErtekeles} />
          </label>

          <label>
            Vélemény szövege
            <textarea
              value={ujSzoveg}
              onChange={(e) => setUjSzoveg(e.target.value)}
              rows={4}
              required
            />
          </label>

          <button type="submit" className="btn">
            Vélemény elküldése
          </button>
        </form>
      ) : (
        <p>
          Vélemény írásához <Link to="/bejelentkezes">jelentkezz be</Link>.
        </p>
      )}
    </section>
  );
}
