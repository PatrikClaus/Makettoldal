import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:3001/api";

export default function Forum() {
  const { bejelentkezve } = useAuth();

  const [temak, beallitTemak] = useState([]);
  const [kivalasztottTemaId, beallitKivalasztottTemaId] = useState(null);
  const [uzenetek, beallitUzenetek] = useState([]);

  const [ujTemaCim, beallitUjTemaCim] = useState("");
  const [ujTemaLeiras, beallitUjTemaLeiras] = useState("");

  const [ujUzenetSzoveg, beallitUjUzenetSzoveg] = useState("");

  const [betoltes, beallitBetoltes] = useState(false);
  const [hiba, beallitHiba] = useState(null);

  async function betoltTemak() {
    try {
      beallitBetoltes(true);
      beallitHiba(null);
      const valasz = await fetch(`${API_BASE_URL}/forum/temak`);
      if (!valasz.ok) throw new Error("Nem sikerült lekérni a témákat.");
      const adat = await valasz.json();
      beallitTemak(adat);
    } catch (err) {
      beallitHiba(err.message);
    } finally {
      beallitBetoltes(false);
    }
  }

  async function betoltUzenetek(temaId) {
    try {
      beallitBetoltes(true);
      beallitHiba(null);
      const valasz = await fetch(
        `${API_BASE_URL}/forum/temak/${temaId}/uzenetek`
      );
      if (!valasz.ok)
        throw new Error("Nem sikerült lekérni a hozzászólásokat.");
      const adat = await valasz.json();
      beallitUzenetek(adat);
    } catch (err) {
      beallitHiba(err.message);
    } finally {
      beallitBetoltes(false);
    }
  }

  useEffect(() => {
    betoltTemak();
  }, []);

  function kezeliTemaKivalasztas(temaId) {
    if (kivalasztottTemaId === temaId) {
      beallitKivalasztottTemaId(null);
      beallitUzenetek([]);
    } else {
      beallitKivalasztottTemaId(temaId);
      betoltUzenetek(temaId);
    }
  }

  async function kezeliUjTemaKuldes(e) {
    e.preventDefault();
    if (!bejelentkezve) {
      alert("Új téma indításához jelentkezz be.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const valasz = await fetch(`${API_BASE_URL}/forum/temak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cim: ujTemaCim,
          leiras: ujTemaLeiras,
        }),
      });
      if (!valasz.ok) {
        const h = await valasz.json().catch(() => ({}));
        throw new Error(h.uzenet || "Hiba az új téma létrehozásakor.");
      }
      const uj = await valasz.json();
      beallitTemak((elozo) => [uj, ...elozo]);
      beallitUjTemaCim("");
      beallitUjTemaLeiras("");
    } catch (err) {
      alert(err.message);
    }
  }

  async function kezeliUjUzenetKuldes(e) {
    e.preventDefault();
    if (!bejelentkezve) {
      alert("Hozzászóláshoz jelentkezz be.");
      return;
    }
    if (!kivalasztottTemaId) return;

    try {
      const token = localStorage.getItem("token");
      const valasz = await fetch(
        `${API_BASE_URL}/forum/temak/${kivalasztottTemaId}/uzenetek`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ szoveg: ujUzenetSzoveg }),
        }
      );
      if (!valasz.ok) {
        const h = await valasz.json().catch(() => ({}));
        throw new Error(h.uzenet || "Hiba a hozzászólás mentésekor.");
      }
      const uj = await valasz.json();
      beallitUzenetek((elozo) => [...elozo, uj]);
      beallitUjUzenetSzoveg("");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section className="page">
      <h1>Fórum</h1>

      {hiba && <p className="error">{hiba}</p>}
      {betoltes && <p className="small">Betöltés...</p>}

      {/* Új téma form */}
      <div className="card form">
        <h2>Új téma indítása</h2>
        {!bejelentkezve && (
          <p className="small">
            Új téma indításához előbb jelentkezz be.
          </p>
        )}
        <form onSubmit={kezeliUjTemaKuldes}>
          <label>
            Cím
            <input
              type="text"
              value={ujTemaCim}
              onChange={(e) => beallitUjTemaCim(e.target.value)}
              required
            />
          </label>
          <label>
            Leírás (nem kötelező)
            <textarea
              value={ujTemaLeiras}
              onChange={(e) => beallitUjTemaLeiras(e.target.value)}
            />
          </label>
          <button type="submit" className="btn">
            Téma létrehozása
          </button>
        </form>
      </div>

      {/* Témák listája */}
      <div className="card">
        <h2>Témák</h2>
        {temak.length === 0 ? (
          <p className="small">Még nincs egy téma sem.</p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {temak.map((t) => {
              const aktiv = t.id === kivalasztottTemaId;
              const datum = t.letrehozva
                ? new Date(t.letrehozva).toLocaleString("hu-HU")
                : "";
              return (
                <li
                  key={t.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #111827",
                    cursor: "pointer",
                  }}
                  onClick={() => kezeliTemaKivalasztas(t.id)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div>
                      <strong>{t.cim}</strong>
                      <p className="small" style={{ margin: 0 }}>
                        Indította: {t.felhasznalo_nev} – {datum}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className="small" style={{ margin: 0 }}>
                        Hozzászólások: {t.uzenet_db}
                      </p>
                      {t.utolso_valasz && (
                        <p className="small" style={{ margin: 0 }}>
                          Utolsó:{" "}
                          {new Date(t.utolso_valasz).toLocaleDateString(
                            "hu-HU"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {aktiv && t.leiras && (
                    <p className="small" style={{ marginTop: 4 }}>
                      {t.leiras}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Kiválasztott téma hozzászólásai */}
      {kivalasztottTemaId && (
        <div className="card">
          <h2>Hozzászólások</h2>
          {uzenetek.length === 0 ? (
            <p className="small">Még nincs hozzászólás ebben a témában.</p>
          ) : (
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {uzenetek.map((u) => {
                const datum = u.letrehozva
                  ? new Date(u.letrehozva).toLocaleString("hu-HU")
                  : "";
                return (
                  <li
                    key={u.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid #111827",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>{u.felhasznalo_nev}</strong>
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      {datum}
                    </p>
                    <p style={{ marginTop: 4 }}>{u.szoveg}</p>
                  </li>
                );
              })}
            </ul>
          )}

          {bejelentkezve ? (
            <form onSubmit={kezeliUjUzenetKuldes} className="form" style={{ marginTop: 12 }}>
              <label>
                Új hozzászólás
                <textarea
                  value={ujUzenetSzoveg}
                  onChange={(e) => beallitUjUzenetSzoveg(e.target.value)}
                  required
                />
              </label>
              <button type="submit" className="btn">
                Küldés
              </button>
            </form>
          ) : (
            <p className="small" style={{ marginTop: 8 }}>
              Hozzászóláshoz jelentkezz be.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
