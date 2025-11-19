// client/src/components/AiChatWidget.jsx
import React, { useRef, useState } from "react";
import { getWebLlmEngine } from "../ai/webllmEngine";

export default function AiChatWidget() {
  const [nyitva, beallitNyitva] = useState(false);
  const [uzenet, beallitUzenet] = useState("");
  const [uzenetek, beallitUzenetek] = useState([]); // {from:"user"|"bot", text}
  const [betolt, beallitBetolt] = useState(false);
  const [modellToltes, beallitModellToltes] = useState(false);
  const [modellProgress, beallitModellProgress] = useState(0);
  const [hiba, beallitHiba] = useState(null);

  const engineRef = useRef(null);

  const nincsWebGPU = typeof navigator !== "undefined" && !("gpu" in navigator);

  async function kuldUzenet(e) {
    e?.preventDefault();
    const szoveg = uzenet.trim();
    if (!szoveg || betolt) return;
    beallitHiba(null);

    const ujUser = { from: "user", text: szoveg };
    beallitUzenetek((elozo) => [...elozo, ujUser]);
    beallitUzenet("");

    try {
      beallitBetolt(true);

      // Engine inicializálása, ha még nincs
      if (!engineRef.current) {
        if (nincsWebGPU) {
          throw new Error(
            "A böngésződ nem támogatja a WebGPU-t. Próbáld meg egy frissebb Chrome/Edge/Brave böngészővel."
          );
        }

        beallitModellToltes(true);
        const engine = await getWebLlmEngine((p) => {
          if (typeof p.progress === "number") {
            beallitModellProgress(Math.round(p.progress * 100));
          }
        });
        engineRef.current = engine;
        beallitModellToltes(false);
      }

      const vegsoUzenetek = [
        {
          role: "system",
          content:
"Te egy 'MakettMester AI' nevű segítő vagy. Magyarul válaszolsz, tegezel. " +
"Kezdő és haladó makettezőknek segítesz: festés, ragasztás, csiszolás, panelvonalak, diorámák. " +
"Mindig adj konkrét, lépésről lépésre tippeket, említs meg gyakori hibákat és azok elkerülését. " +
"Válaszaid legyenek rövidek (3–5 mondat), de informatívak. Ha valamiben nem vagy biztos, írd le, hogy bizonytalan vagy."

        },
        ...uzenetek.map((m) => ({
          role: m.from === "bot" ? "assistant" : "user",
          content: m.text,
        })),
        { role: "user", content: szoveg },
      ];

      const reply = await engineRef.current.chat.completions.create({
        messages: vegsoUzenetek,
      });

      const valaszSzoveg =
        reply?.choices?.[0]?.message?.content ||
        "Nem sikerült értelmes választ adnom, bocs 😅";

      const ujBot = { from: "bot", text: valaszSzoveg };
      beallitUzenetek((elozo) => [...elozo, ujBot]);
    } catch (err) {
      console.error(err);
      beallitHiba(err.message || "Ismeretlen hiba történt az AI híváskor.");
      const ujBot = {
        from: "bot",
        text:
          "Most valamiért nem tudok rendesen válaszolni. " +
          (err.message || ""),
      };
      beallitUzenetek((elozo) => [...elozo, ujBot]);
    } finally {
      beallitBetolt(false);
    }
  }

  return (
    <>
      {/* Lebegő gomb jobb alsó sarokban */}
      <button
        className="ai-fab"
        type="button"
        onClick={() => beallitNyitva((nyit) => !nyit)}
      >
        🤖
      </button>

      {nyitva && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <strong>MakettMester AI</strong>
            <button
              type="button"
              className="ai-chat-close"
              onClick={() => beallitNyitva(false)}
            >
              ×
            </button>
          </div>

          <div className="ai-chat-body">
            {nincsWebGPU && (
              <p className="ai-chat-hint">
                Úgy tűnik, a böngésződ nem támogatja a WebGPU-t. Próbáld meg
                egy frissebb Chromium alapú böngészővel (Chrome, Edge, Brave).
              </p>
            )}

            {!nincsWebGPU && uzenetek.length === 0 && (
              <p className="ai-chat-hint">
                Kérdezz bátran makettezésről: festés, ragasztás, alap technikák,
                mit vegyen egy kezdő, stb. Röviden fogok válaszolni.
              </p>
            )}

            {hiba && <p className="error">{hiba}</p>}

            {modellToltes && (
              <p className="ai-chat-hint">
                Modell betöltése... {modellProgress}% (első használatkor kicsit
                hosszabb lehet)
              </p>
            )}

            {uzenetek.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.from === "user" ? "ai-msg ai-msg-user" : "ai-msg ai-msg-bot"
                }
              >
                <span>{m.text}</span>
              </div>
            ))}

            {betolt && <p className="ai-chat-hint">Gondolkodom...</p>}
          </div>

          <form className="ai-chat-footer" onSubmit={kuldUzenet}>
            <input
              type="text"
              placeholder="Írd ide a kérdésed..."
              value={uzenet}
              onChange={(e) => beallitUzenet(e.target.value)}
              disabled={nincsWebGPU}
            />
            <button
              type="submit"
              disabled={betolt || nincsWebGPU || !uzenet.trim()}
            >
              Küldés
            </button>
          </form>
        </div>
      )}
    </>
  );
}
