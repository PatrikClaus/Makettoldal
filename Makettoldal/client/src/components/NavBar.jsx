import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AvatarKicsi({ nev, profilKepUrl }) {
  const normalizal = (url) => {
    if (!url) return "";
    if (url.startsWith("/uploads/")) return `http://localhost:3001${url}`;
    return url;
  };

  if (profilKepUrl) {
    return (
      <img
        src={normalizal(profilKepUrl)}
        alt={`${nev || "Felhasználó"} profilképe`}
        className="nav-avatar-img"
      />
    );
  }

  const kezdobetuk = (nev || "?")
    .split(" ")
    .map((r) => r[0])
    .join("")
    .toUpperCase();

  return (
    <div className="nav-avatar">{kezdobetuk}</div>
  );
}
export default function NavBar() {
  const { felhasznalo, kijelentkezes } = useAuth();
  const bejelentkezve = !!felhasznalo;
  const admin = felhasznalo?.szerepkor_id === 2;

  return (
    <header className="nav">
      <div className="nav-left">
        <span className="logo">Makettező Klub</span>

        <NavLink to="/" className="nav-link">Kezdőlap</NavLink>
        <NavLink to="/makettek" className="nav-link">Makettek</NavLink>
        <NavLink to="/forum" className="nav-link">Fórum</NavLink>
        <NavLink to="/rolunk" className="nav-link">Rólunk</NavLink>

        {bejelentkezve && (
          <>
            <NavLink to="/kedvencek" className="nav-link">Kedvenceim</NavLink>
            <NavLink to="/velemenyeim" className="nav-link">Véleményeim</NavLink>
            <NavLink to="/epitesinaplo" className="nav-link">Építési napló</NavLink>
            <NavLink to="/makett-bekuldes" className="nav-link">Makett beküldés</NavLink>
            {admin && (
            <NavLink to="/admin/makett-jovahagyas" className="nav-link">Jóváhagyás</NavLink>
)}

          </>
        )}

        {admin && <span className="nav-badge">Admin</span>}
      </div>

      <div className="nav-right">
        {bejelentkezve ? (
          <>
            <Link to="/profil" className="nav-profile">
              <AvatarKicsi
                nev={felhasznalo.felhasznalo_nev}
                profilKepUrl={felhasznalo.profil_kep_url}
              />
              <span className="nav-user-name">
                {felhasznalo.felhasznalo_nev}
              </span>
            </Link>

            <button
              className="nav-btn"
              onClick={kijelentkezes}
            >
              Kijelentkezés
            </button>
          </>
        ) : (
          <>
            <NavLink to="/bejelentkezes" className="nav-link">
              Bejelentkezés
            </NavLink>
            <NavLink to="/regisztracio" className="nav-link">
              Regisztráció
            </NavLink>
          </>
        )}
      </div>
    </header>
  );
}
