import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { isUnlocked } from "../lib/gate.js";
import { shelves } from "../lib/books.js";
import ShelfRow from "../components/ShelfRow.jsx";
import BookModal from "../components/BookModal.jsx";

export default function Shelf() {
  const [open, setOpen] = useState(null);
  const trigger = useRef(null);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onOpen = useCallback((book, el) => {
    trigger.current = el;
    el.classList.add("lifted");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(book), 140);
  }, []);

  const onClose = useCallback(() => {
    setOpen(null);
    const el = trigger.current;
    if (el) {
      el.classList.remove("lifted");
      el.focus({ preventScroll: true });
    }
  }, []);

  if (!isUnlocked()) return <Navigate to="/" replace />;

  return (
    <div className="shelf-page">
      <header className="bar">
        <Link to="/shelf" className="wordmark">
          The Get-Lost Shelf
        </Link>
        <Link to="/print" className="bar-link">
          Print the short list
        </Link>
      </header>
      <p className="quiet">Put one on the floor tonight.</p>
      <main>
        {shelves.map((s) => (
          <ShelfRow key={s.name} name={s.name} books={s.books} onOpen={onOpen} />
        ))}
      </main>
      {open && <BookModal book={open} onClose={onClose} />}
    </div>
  );
}
