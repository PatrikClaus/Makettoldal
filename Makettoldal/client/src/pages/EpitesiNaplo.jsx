import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAdat } from "../context/AdatContext";

const API_BASE_URL = "http://localhost:3001/api";
const LEPES_MAX = 5;

export default function EpitesiNaplo() {
  const { bejelentkezve } = useAuth();
  const { makettek, betoltesFolyamatban, betoltAlapAdatok } = useAdat();

  const [bejegyzesek, beallitBejegyzesek] = useState([]);
  const [betoltes, beallitBetoltes] = useState(false);
  const [hiba, beallitHiba] = useState(null);

  const [valasztottMakettId, beallitValasztottMakettId] = useState("");
  const [cim, beallitCim] = useState("");
  const [leiras, beallitLeiras] = useState("");
  const [kepUrl, beallitKepUrl] = useState("");

  const [lepes, beallitLepes] = useState(1);
  const [kuldesFolyamatban, beallitKuldesFolyamatban] = useState(false);

  useEffect(() => {
    betoltAlapAdatok();
  }, [betoltAlapAdatok]);

  async function betoltBejegyzesek() {
    try {
      beallitBetoltes(true);
      beallitHiba(null);
      const valasz = await fetch(`${API_BASE_URL}/epitesinaplo`);
      if (!valasz.ok) {
        const h = await valasz.json().catch(() => ({}));
        throw new Error(h.uzenet || "Nem sikerült betölteni az építési naplókat.");
      }
      const adat = await valasz.json();
      beallitBejegyzesek(adat);
    } catch (err) {
      beallitHiba(err.message);
    } finally {
      beallitBetoltes(false);
    }
  }

  useEffect(() => {
    betoltBejegyzesek();
  }, []);

  function lepesHibaUzenet() {
    if (!bejelentkezve) return "Bejegyzés írásához előbb jelentkezz be.";
    if (lepes === 1 && !valasztottMakettId) return "Válassz makettet.";
    if (lepes === 2 && cim.trim().length < 3) return "A cím legyen legalább 3 karakter.";
    if (lepes === 3 && leiras.trim().length < 10) return "A leírás legyen legalább 10 karakter.";
    if (lepes === 4 && kepUrl.trim() && !/^https?:\/\/.+/i.test(kepUrl.trim()))
      return "A kép URL-nek http(s)://-el kell kezdődnie.";
    return null;
  }

  function tovabb() {
    const err = lepesHibaUzenet();
    if (err) {
      alert(err);
      return;
    }
    beallitLepes((x) => Math.min(LEPES_MAX, x + 1));
  }

  function vissza() {
    beallitLepes((x) => Math.max(1, x - 1));
  }

  async function kezeliUjBejegyzesKuldes(e) {
    e.preventDefault();

    if (lepes !== LEPES_MAX) {
      alert("Előbb lépj a végére (Ellenőrzés) a beküldéshez.");
      return;
    }

    if (!bejelentkezve) {
      alert("Építési napló írásához jelentkezz be.");
      return;
    }

    try {
      beallitKuldesFolyamatban(true);
      const token = localStorage.getItem("token");
      const valasz = await fetch(`${API_BASE_URL}/epitesinaplo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          makett_id: valasztottMakettId,
          cim,
          leiras,
          kep_url: kepUrl || null,
        }),
      });

      if (!valasz.ok) {
        const h = await valasz.json().catch(() => ({}));
        throw new Error(h.uzenet || "Hiba az építési napló mentésekor.");
      }

      const uj = await valasz.json();
      beallitBejegyzesek((elozo) => [uj, ...elozo]);

      // reset
      beallitValasztottMakettId("");
      beallitCim("");
      beallitLeiras("");
      beallitKepUrl("");
      beallitLepes(1);
    } catch (err) {
      alert(err.message);
    } finally {
      beallitKuldesFolyamatban(false);
    }
  }

  const valasztottMakett = makettek.find(
    (m) => String(m.id) === String(valasztottMakettId)
  );

  return (
    <section className="page">
      <h1>Építési naplók</h1>
      <p className="small">
        Oszd meg, hogyan haladsz a makettek építésével – képekkel és leírással.
      </p>

      {betoltesFolyamatban && <p>Makett adatok betöltése...</p>}
      {hiba && <p className="error">{hiba}</p>}

      {/* Új bejegyzés – lépésenként */}
      <div className="card form">
        <h2>Új építési napló (lépésenként)</h2>

        {!bejelentkezve && (
          <p className="small">Bejegyzés írásához előbb jelentkezz be.</p>
        )}

        {/* Progress */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <div className="chip">LÉPÉS: {lepes}/{LEPES_MAX}</div>
          <div className="chip">
            {lepes === 1 && "Makett kiválasztása"}
            {lepes === 2 && "Cím megadása"}
            {lepes === 3 && "Leírás megadása"}
            {lepes === 4 && "Kép (opcionális)"}
            {lepes === 5 && "Ellenőrzés + Küldés"}
          </div>
        </div>

        <form onSubmit={kezeliUjBejegyzesKuldes}>

          {/* 1. LÉPÉS */}
          {lepes === 1 && (
            <label>
              Makett
              <select
                value={valasztottMakettId}
                onChange={(e) => beallitValasztottMakettId(e.target.value)}
                required
                disabled={!bejelentkezve}
              >
                <option value="">Válassz makettet...</option>
                {makettek.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nev} ({m.gyarto}, {m.skala})
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* 2. LÉPÉS */}
          {lepes === 2 && (
            <label>
              Cím
              <input
                type="text"
                value={cim}
                onChange={(e) => beallitCim(e.target.value)}
                placeholder="Pl.: Alapozás + első festés"
                required
                disabled={!bejelentkezve}
              />
            </label>
          )}

          {/* 3. LÉPÉS */}
          {lepes === 3 && (
            <label>
              Leírás
              <textarea
                value={leiras}
                onChange={(e) => beallitLeiras(e.target.value)}
                rows={6}
                placeholder="Írd le részletesen, mit csináltál..."
                required
                disabled={!bejelentkezve}
              />
            </label>
          )}

          {/* 4. LÉPÉS */}
          {lepes === 4 && (
            <label>
              Kép URL (opcionális)
              <input
                type="url"
                placeholder="https://..."
                value={kepUrl}
                onChange={(e) => beallitKepUrl(e.target.value)}
                disabled={!bejelentkezve}
              />

              {kepUrl?.trim() && (
                <div className="makett-kep-wrapper" style={{ marginTop: 10 }}>
                  <img src={kepUrl} alt="Előnézet" className="makett-kep" />
                </div>
              )}
            </label>
          )}

          {/* 5. LÉPÉS */}
          {lepes === 5 && (
            <div className="card" style={{ marginTop: 10 }}>
              <h3>Előnézet</h3>
              <p className="small">
                Makett:{" "}
                <strong>
                  {valasztottMakett
                    ? `${valasztottMakett.nev} (${valasztottMakett.gyarto}, ${valasztottMakett.skala})`
                    : "-"}
                </strong>
              </p>
              <p><strong>{cim}</strong></p>
              <p>{leiras}</p>

              {kepUrl?.trim() && (
                <div className="makett-kep-wrapper" style={{ marginTop: 10 }}>
                  <img src={kepUrl} alt={cim} className="makett-kep" />
                </div>
              )}
            </div>
          )}

          {/* Gombok */}
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn secondary"
              onClick={vissza}
              disabled={lepes === 1 || kuldesFolyamatban}
            >
              Vissza
            </button>

            {lepes < LEPES_MAX ? (
              <button
                type="button"
                className="btn"
                onClick={tovabb}
                disabled={kuldesFolyamatban}
              >
                Tovább
              </button>
            ) : (
              <button
                type="submit"
                className="btn"
                disabled={kuldesFolyamatban}
              >
                {kuldesFolyamatban ? "Mentés..." : "Bejegyzés mentése"}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Bejegyzések listája */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Összes bejegyzés</h2>
        {betoltes && <p>Betöltés...</p>}
        {bejegyzesek.length === 0 && !betoltes ? (
          <p>Még nincs egyetlen építési napló bejegyzés sem.</p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {bejegyzesek.map((b) => {
              const datum = b.letrehozva
                ? new Date(b.letrehozva).toLocaleString("hu-HU")
                : "";
              return (
                <li
                  key={b.id}
                  style={{
                    borderBottom: "1px solid rgba(116,130,112,0.22)",
                    padding: "8px 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div>
                      <strong>{b.cim}</strong>
                      <p className="small" style={{ margin: 0 }}>
                        {b.makett_nev} ({b.gyarto}, {b.skala})
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className="small" style={{ margin: 0 }}>
                        {b.felhasznalo_nev}
                      </p>
                      <p className="small" style={{ margin: 0 }}>
                        {datum}
                      </p>
                    </div>
                  </div>
                  <p style={{ marginTop: 4 }}>{b.leiras}</p>
                  {b.kep_url && (
                    <div className="makett-kep-wrapper" style={{ marginTop: 4 }}>
                      <img
                        src={b.kep_url}
                        alt={b.cim}
                        className="makett-kep"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
