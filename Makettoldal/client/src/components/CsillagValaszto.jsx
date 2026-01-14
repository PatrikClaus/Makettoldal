import React from "react";

/**
 * Egyszerű 1–5 csillagos választó.
 * - value: szám (pl. 4)
 * - onChange: (newValue) => void
 * - readOnly: ha true, nem kattintható
 */
export default function CsillagValaszto({ value, onChange, readOnly = false }) {
  const aktivErtek = Number(value) || 0;

  return (
    <div className="rating-stars" aria-label="Értékelés">
      {Array.from({ length: 5 }).map((_, idx) => {
        const csillagErtek = idx + 1;
        const aktiv = csillagErtek <= aktivErtek;

        return (
          <button
            key={csillagErtek}
            type="button"
            className={aktiv ? "star active" : "star"}
            onClick={() => !readOnly && onChange?.(csillagErtek)}
            disabled={readOnly}
            aria-label={`${csillagErtek} csillag`}
          >
            {aktiv ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}
