import React, { useMemo } from "react";
import { useAdat } from "../context/AdatContext";

function CsillagokKicsi({ ertek }) {
  const teljes = Math.round(ertek || 0);
  return (
    <span style={{ fontSize: 14 }}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <span key={idx}>{idx < teljes ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export default function Kezdolap() {
  const { makettek, velemenyek, szamolAtlagErtekeles } = useAdat();

  const osszesMakett = makettek.length;
  const osszesVelemeny = velemenyek.length;

  const globalisAtlag =
    velemenyek.length > 0
      ? velemenyek.reduce((sum, v) => sum + Number(v.ertekeles || 0), 0) /
        velemenyek.length
      : null;

  // Top 3 legjobbra értékelt makett
  const topMakettek = useMemo(() => {
    if (!makettek.length || !velemenyek.length) return [];

    const lista = makettek
      .map((m) => {
        const atlag = szamolAtlagErtekeles(m.id) || 0;
        return { ...m, atlag };
      })
      .filter((m) => m.atlag > 0)
      .sort((a, b) => b.atlag - a.atlag)
      .slice(0, 3);

    return lista;
  }, [makettek, velemenyek, szamolAtlagErtekeles]);

  // Legutóbbi 3 vélemény
  const legutobbiVelemenyek = useMemo(() => {
    if (!velemenyek.length) return [];
    const masolat = [...velemenyek];

    masolat.sort((a, b) => {
      const da = a.letrehozva ? new Date(a.letrehozva).getTime() : 0;
      const db = b.letrehozva ? new Date(b.letrehozva).getTime() : 0;
      return db - da;
    });

    return masolat.slice(0, 3);
  }, [velemenyek]);

  function roviditSzoveg(szoveg, max = 120) {
    if (!szoveg) return "";
    if (szoveg.length <= max) return szoveg;
    return szoveg.slice(0, max - 3) + "...";
  }

  return (
    <section className="page">
      <h1>Üdv a makettező klub oldalán!</h1>

      {/* Összefoglaló statisztika */}
      <div className="card">
        <h2>Összefoglaló</h2>
        <p>
          Összes makett: <strong>{osszesMakett}</strong>
        </p>
        <p>
          Összes vélemény: <strong>{osszesVelemeny}</strong>
        </p>
        <p>
          Átlagos értékelés:{" "}
          {globalisAtlag ? (
            <>
              <strong>{globalisAtlag.toFixed(2)}</strong>{" "}
              <CsillagokKicsi ertek={globalisAtlag} />
            </>
          ) : (
            "még nincs értékelés"
          )}
        </p>
      </div>

      {/* Top 3 makett box */}
      <div className="card">
        <h2>Legjobbra értékelt makettek</h2>
        {topMakettek.length === 0 ? (
          <p className="small">
            Még nincs elég értékelés a listához. Adj véleményt néhány
            makettről a <strong>Makettek</strong> oldalon! 🙂
          </p>
        ) : (
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            {topMakettek.map((m) => (
              <li key={m.id} style={{ marginBottom: 6 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span>
                    <strong>{m.nev}</strong> – {m.gyarto} ({m.kategoria},{" "}
                    {m.skala})
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>
                    {m.atlag.toFixed(2)} <CsillagokKicsi ertek={m.atlag} />
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Legutóbbi vélemények */}
      <div className="card">
        <h2>Legutóbbi vélemények</h2>
        {legutobbiVelemenyek.length === 0 ? (
          <p className="small">
            Még nincs egyetlen vélemény sem. Légy te az első, aki ír a{" "}
            <strong>Makettek</strong> oldalon! 🙂
          </p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {legutobbiVelemenyek.map((v) => {
              const datum = v.letrehozva
                ? new Date(v.letrehozva).toLocaleString("hu-HU")
                : "";
              return (
                <li
                  key={v.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #111827",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 2,
                    }}
                  >
                    <span>
                      <strong>{v.felhasznalo_nev}</strong> a{" "}
                      <em>{v.makett_nev}</em> makettről
                    </span>
                    <span style={{ whiteSpace: "nowrap" }}>
                      {v.ertekeles} / 5 <CsillagokKicsi ertek={v.ertekeles} />
                    </span>
                  </div>
                  <p className="small">{roviditSzoveg(v.szoveg)}</p>
                  {datum && (
                    <p className="small" style={{ opacity: 0.8 }}>
                      {datum}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="small">
        A fenti menüben eléred a makettek listáját, véleményeket írhatsz, és a
        profilodnál a kedvenc makettjeidet is megnézheted.
      </p>
    </section>
  );
}
