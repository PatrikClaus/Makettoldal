import React from "react";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          MakettKlub
        </Link>

        <div className="nav-links">
          <Link to="/">Kezdőlap</Link>
          <Link to="/makettek">Makettek</Link>
          <Link to="/forum">Fórum</Link>
          <Link to="/profil">Profil</Link>
          <Link to="/bejelentkezes">Bejelentkezés</Link>
          <Link to="/regisztracio">Regisztráció</Link>
        </div>
      </div>
    </nav>
  );
}
