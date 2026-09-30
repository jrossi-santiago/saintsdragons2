import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isUnlocked, unlock } from "../lib/gate.js";
import { books } from "../lib/books.js";
import Spine from "../components/Spine.jsx";

const ENDPOINT = import.meta.env.EMAIL_ENDPOINT;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A dim row of real spines from the data, spread across the whole list.
function backdropBooks(max = 34) {
  if (books.length <= max) return books;
  const step = books.length / max;
  return Array.from({ length: max }, (_, i) => books[Math.floor(i * step)]);
}

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const back = useMemo(() => backdropBooks(), []);

  if (isUnlocked()) return <Navigate to="/shelf" replace />;

  async function submit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("That doesn’t look like an email.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email: value, source: "get-lost-shelf" }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        console.log("[get-lost-shelf] EMAIL_ENDPOINT not set; unlocking locally:", value);
      }
      unlock();
      navigate("/shelf", { replace: true });
    } catch (err) {
      console.error("[get-lost-shelf] email submit failed", err);
      setError("Didn’t go through. Try once more.");
      setBusy(false);
    }
  }

  return (
    <div className="landing">
      <header className="bar">
        <span className="wordmark">The Get-Lost Shelf</span>
      </header>
      <div className="backdrop" aria-hidden="true">
        <ul className="spines">
          {back.map((b) => (
            <li key={b.id}>
              <Spine book={b} />
            </li>
          ))}
        </ul>
      </div>
      <main className="pitch">
        <h1>The Get-Lost Shelf</h1>
        <p className="sub">Books dense enough that a kid will sit still without a screen.</p>
        <p>
          Screens win because they’re easy and endless. These books win the same game. A kid stares,
          hunts, laughs, asks “what’s that?”, and an hour disappears. History, how things work, and
          attention show up as a side effect. Nobody lectures. Nobody sells a worldview. Just old
          paper full of tiny worlds.
        </p>
        <p className="floor">Put one book on the floor after dinner. No timer. No deal.</p>
        <p className="reason">
          Unlock the shelf. I’ll send you in and a one-page printable list so you can use it tonight.
          No drip. No video course.
        </p>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@email.com"
              aria-label="Email"
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "email-error" : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={busy}>
              Open the shelf
            </button>
          </div>
          {error && (
            <p id="email-error" className="error" role="alert">
              {error}
            </p>
          )}
          <p className="micro">A short list of books kids get lost in. Unsubscribe whenever.</p>
        </form>
      </main>
    </div>
  );
}
