import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:3001/api";

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

export default function MakettJovahagyas() {
  const { felhasznalo } = useAuth();
  const admin = felhasznalo?.szerepkor_id === 2;

  const [lista, setLista] = useState([]);
  const [hiba, setHiba] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const betolt = async () => {
    setHiba("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/makett-javaslatok`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.uzenet || "Hiba a lista betöltésekor.");
      setLista(Array.isArray(data) ? data : []);
    } catch (e) {
      setHiba(e.message || "Hiba.");
      setLista([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) betolt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  if (!felhasznalo) {
    return (
      <div className="page">
        <div className="card">
          <h2>Jóváhagyás</h2>
          <p className="small">Be kell jelentkezned.</p>
          <Link className="btn" to="/bejelentkezes">Bejelentkezés</Link>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="page">
        <div className="card">
          <h2>Jóváhagyás</h2>
          <div className="notice error">Nincs jogosultságod.</div>
          <Link className="btn secondary" to="/makettek">Vissza</Link>
        </div>
      </div>
    );
  }

  const jovahagy = async (id) => {
    await fetch(`${API}/admin/makett-javaslatok/${id}/jovahagy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    betolt();
  };

  const elutasit = async (id) => {
    const ok = prompt("Elutasítás oka (opcionális):") || "";
    await fetch(`${API}/admin/makett-javaslatok/${id}/elutasit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ok }),
    });
    betolt();
  };

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ marginBottom: 6 }}>Makett javaslatok</h2>
            <span className="small">Várakozó beküldések (admin)</span>
          </div>

          <button className="btn secondary" onClick={betolt} disabled={loading}>
            {loading ? "Frissítés..." : "Frissítés"}
          </button>
        </div>

        {hiba && <div className="notice error">{hiba}</div>}

        {lista.length === 0 ? (
          <div className="notice">{loading ? "Betöltés..." : "Nincs várakozó javaslat."}</div>
        ) : (
          <div className="grid">
            {lista.map((m) => (
              <div key={m.id} className="card">
                <div className="card-header">
                  <div>
                    <h3 style={{ margin: 0 }}>{m.nev}</h3>
                    <div className="small">
                      {m.gyarto} • {m.kategoria} • {m.skala} • nehézség: {m.nehezseg}
                    </div>
                  </div>
                  <span className="chip chip-wait">várakozik</span>
                </div>

                <div className="small">
                  Beküldő: <b>{m.bekuldo_nev || "ismeretlen"}</b>
                  <br />
                  Beküldve: {fmt(m.bekuldve)}
                </div>

                <div className="button-row" style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => jovahagy(m.id)}>
                    Jóváhagy
                  </button>
                  <button className="btn danger" onClick={() => elutasit(m.id)}>
                    Elutasít
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
