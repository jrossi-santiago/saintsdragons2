import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { isUnlocked } from "../lib/gate.js";
import { collections } from "../lib/books.js";

export default function Print() {
  useEffect(() => {
    document.documentElement.classList.add("paper");
    return () => document.documentElement.classList.remove("paper");
  }, []);

  if (!isUnlocked()) return <Navigate to="/" replace />;

  return (
    <div className="print-page">
      <div className="print-tools">
        <Link to="/shelf">← Back to the shelf</Link>
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <h1>The Get-Lost Shelf</h1>
      <p className="print-sub">Put one on the floor tonight. No timer. No deal.</p>
      <div className="print-cols">
        {collections.map((s) => (
          <section key={s.name}>
            <h2>{s.name}</h2>
            <ul>
              {s.books.map((b) => (
                <li key={b.id}>
                  <strong>{b.title}</strong>
                  {b.author && <span className="pa"> — {b.author}</span>}
                  {b.oneLiner && <p className="pl">{b.oneLiner}</p>}
                  {b.amazonUrl && <a className="pu" href={b.amazonUrl}>{b.amazonUrl}</a>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
