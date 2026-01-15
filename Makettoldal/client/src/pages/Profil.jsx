import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAdat } from "../context/AdatContext";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3001/api";
const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

function normalizalKepUrl(url) {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return FILE_BASE_URL + url;
  return url;
}

function generalSzin(nev) {
  if (!nev) return "#4b5563";
  let hash = 0;
  for (let i = 0; i < nev.length; i++) {
    hash = nev.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

function AvatarNagy({ nev, profilKepUrl }) {
  if (profilKepUrl) {
    return (
      <div className="profile-avatar-wrapper">
        <img
          src={normalizalKepUrl(profilKepUrl)}
          alt={`${nev || "Felhasználó"} profilképe`}
          className="profile-avatar-image"
        />
      </div>
    );
  }

  const safeNev = (nev || "P").trim();
  const kezdobetu = safeNev.charAt(0).toUpperCase();
  const hatter = generalSzin(safeNev);

  return (
    <div
      className="profile-avatar-fallback"
      style={{ background: hatter }}
      aria-label="Profil avatar"
      title={safeNev}
    >
      {kezdobetu}
    </div>
  );
}

export default function Profil() {
  const { felhasznalo, bejelentkezve, kijelentkezes, profilFrissites } =
    useAuth();
  const { makettek, kedvencek, betoltKedvencek } = useAdat();
  const navigate = useNavigate();

  const [nev, beallitNev] = useState(felhasznalo?.felhasznalo_nev || "");
  const [profilKepUrl, beallitProfilKepUrl] = useState(
    felhasznalo?.profil_kep_url || ""
  );
  const [ujProfilKep, beallitUjProfilKep] = useState(null);
  const [mentesFolyamatban, beallitMentesFolyamatban] = useState(false);

  useEffect(() => {
    if (!bejelentkezve) {
      navigate("/bejelentkezes");
      return;
    }
    betoltKedvencek();
  }, [bejelentkezve, navigate, betoltKedvencek]);

  useEffect(() => {
    if (felhasznalo) {
      beallitNev(felhasznalo.felhasznalo_nev || "");
      beallitProfilKepUrl(normalizalKepUrl(felhasznalo.profil_kep_url || ""));
    }
  }, [felhasznalo]);

  if (!bejelentkezve) return null;

  async function kezeliProfilMentese(e) {
    e.preventDefault();
    try {
      beallitMentesFolyamatban(true);

      // 1) Név / profil URL frissítése
      await profilFrissites({
        felhasznalo_nev: nev,
        profil_kep_url: profilKepUrl,
      });

      // 2) Ha van feltöltött kép → külön kérés
      if (ujProfilKep) {
        const formData = new FormData();
        formData.append("profilkep", ujProfilKep);

        const token = localStorage.getItem("token");

        const valasz = await fetch(`${API_BASE_URL}/profil/feltoltes`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await valasz.json();
        if (data.kepUrl) {
          beallitProfilKepUrl(data.kepUrl);
          await profilFrissites({
            felhasznalo_nev: nev,
            profil_kep_url: data.kepUrl,
          });
        }
      }

      alert("Profil sikeresen frissítve!");
    } catch (err) {
      alert(err.message);
    } finally {
      beallitMentesFolyamatban(false);
    }
  }

  function kezeliKijelentkezes() {
    kijelentkezes();
    navigate("/");
  }

  const kedvencMakettek = makettek.filter((m) => kedvencek.includes(m.id));

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1 style={{ marginBottom: 6 }}>Profilom</h1>
          <p className="small" style={{ margin: 0 }}>
            Adataid frissítése és kedvenceid kezelése.
          </p>
        </div>
        <div className="chip">
          {felhasznalo?.szerepkor_id === 2 ? "ADMIN ACCESS" : "USER ACCESS"}
        </div>
      </div>

      <div className="profile-grid">
        {/* BAL: felhasználó kártya */}
        <aside className="card profile-side">
          <div className="profile-side-top">
            <AvatarNagy nev={nev} profilKepUrl={profilKepUrl} />
            <div className="profile-side-meta">
              <div className="profile-name">{nev || "Felhasználó"}</div>
              <div className="profile-email">{felhasznalo.email}</div>
              <div className="profile-role">
                <span className="chip">
                  {felhasznalo.szerepkor_id === 2 ? "ADMIN" : "FELHASZNÁLÓ"}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-side-stats">
            <div className="stat">
              <div className="stat-label">Kedvencek</div>
              <div className="stat-value">{kedvencMakettek.length}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Státusz</div>
              <div className="stat-value ok">ONLINE</div>
            </div>
          </div>

          <div className="profile-side-actions">
            <button
              type="button"
              className="btn danger"
              onClick={kezeliKijelentkezes}
            >
              Kijelentkezés
            </button>
          </div>
        </aside>

        {/* JOBB: szerkesztés */}
        <div className="card profile-main">
          <div className="profile-main-head">
            <h2 style={{ margin: 0 }}>Profil beállítások</h2>
            <div className="chip">PROFILE CONFIG</div>
          </div>

          <form onSubmit={kezeliProfilMentese} className="form profile-form-grid">
            <label>
              Név
              <input
                type="text"
                value={nev}
                onChange={(e) => beallitNev(e.target.value)}
                required
              />
            </label>

            <label>
              Profilkép URL
              <input
                type="url"
                value={profilKepUrl}
                onChange={(e) => beallitProfilKepUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>

            <div className="profile-file">
  <label className="profile-file-label">Profilkép feltöltése</label>

  {/* Rejtett input */}
  <input
    type="file"
    id="profilkep-file"
    accept="image/*"
    className="file-hidden-input"
    onChange={(e) => beallitUjProfilKep(e.target.files[0])}
  />

  {/* Szép gomb */}
  <label htmlFor="profilkep-file" className="file-btn">
    📁 Fájl kiválasztása
  </label>

  {/* Fájl neve */}
  {ujProfilKep && (
    <div className="file-name">
      Kiválasztva: <strong>{ujProfilKep.name}</strong>
    </div>
  )}

  <span className="small file-hint">
    Tipp: 1–2 MB alatti JPG vagy PNG ajánlott.
  </span>
</div>

{ujProfilKep && (
  <div className="makett-kep-wrapper" style={{ marginTop: 10 }}>
    <img
      src={URL.createObjectURL(ujProfilKep)}
      alt="Profilkép előnézet"
      className="makett-kep"
    />
  </div>
)}


            <div className="profile-form-actions">
              <button type="submit" className="btn" disabled={mentesFolyamatban}>
                {mentesFolyamatban ? "Mentés..." : "Profil mentése"}
              </button>

              <Link to="/makettek" className="btn secondary profile-linkbtn">
                Makettek megnyitása
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Kedvencek */}
      <section className="card" style={{ marginTop: 16 }}>
        <div className="profile-main-head" style={{ marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Kedvenc makettjeim</h2>
          <div className="chip">FAVORITES</div>
        </div>

        {kedvencMakettek.length === 0 ? (
          <p>
            Még nincs kedvenc maketted. A <Link to="/makettek">Makettek</Link>{" "}
            oldalon a szívecskével tudsz kedvencet jelölni.
          </p>
        ) : (
          <ul className="kedvenc-lista">
            {kedvencMakettek.map((m) => (
              <li key={m.id} className="kedvenc-sor">
                <strong>{m.nev}</strong>
                <span className="small" style={{ opacity: 0.9 }}>
                  {" "}
                  — {m.gyarto} ({m.kategoria}, {m.skala})
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
