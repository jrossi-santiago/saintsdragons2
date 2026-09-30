import { useEffect, useRef, useState } from "react";

function Cover({ book }) {
  return (
    <div className="cover-fallback" style={{ "--c": book.spineColor }}>
      <span>{book.title}</span>
      <em>{book.author}</em>
    </div>
  );
}

function Viewer({ book }) {
  const [dead, setDead] = useState(() => new Set());
  const [i, setI] = useState(0);
  const start = useRef(null);
  const urls = book.images.filter((u) => !dead.has(u));
  const n = urls.length;
  const idx = Math.min(i, Math.max(n - 1, 0));
  const step = (d) => setI((idx + d + n) % n);

  // Arrow keys are wired on the dialog; expose stepping through a ref-less event.
  useEffect(() => {
    if (n < 2) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const drop = (u) => setDead((s) => new Set(s).add(u));
  const onPointerUp = (e) => {
    if (start.current == null || n < 2) return;
    const dx = e.clientX - start.current;
    start.current = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  };

  return (
    <div className="viewer">
      <div
        className="stage"
        style={{ "--c": book.spineColor }}
        onPointerDown={(e) => (start.current = e.clientX)}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (start.current = null)}
      >
        {n === 0 ? (
          <Cover book={book} />
        ) : (
          <img
            key={urls[idx]}
            src={urls[idx]}
            alt={`${book.title}, image ${idx + 1} of ${n}`}
            referrerPolicy="no-referrer"
            draggable="false"
            onLoad={(e) => e.currentTarget.naturalWidth <= 1 && drop(urls[idx])}
            onError={() => drop(urls[idx])}
          />
        )}
        {n > 1 && (
          <>
            <button type="button" className="arrow prev" aria-label="Previous image" onClick={() => step(-1)}>
              ‹
            </button>
            <button type="button" className="arrow next" aria-label="Next image" onClick={() => step(1)}>
              ›
            </button>
          </>
        )}
      </div>
      {n > 1 && (
        <p className="count" aria-live="polite">
          {idx + 1} / {n}
        </p>
      )}
    </div>
  );
}

export default function BookModal({ book, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d.open) d.showModal();
    document.documentElement.classList.add("no-scroll");
    const done = () => onClose();
    d.addEventListener("close", done); // fires for Esc, too
    return () => {
      d.removeEventListener("close", done);
      document.documentElement.classList.remove("no-scroll");
    };
  }, [onClose]);

  return (
    <dialog ref={ref} className="modal" aria-labelledby="modal-title">
      <div className="modal-wrap" onClick={(e) => e.target === e.currentTarget && ref.current.close()}>
        <div className="modal-card">
          <button type="button" className="close" aria-label="Close" onClick={() => ref.current.close()}>
            ×
          </button>
          <Viewer key={book.id} book={book} />
          <div className="info">
            <h2 id="modal-title">{book.title}</h2>
            {book.author && <p className="by">{book.author}</p>}
            {book.oneLiner && <p className="line">{book.oneLiner}</p>}
            {book.amazonUrl && (
              <a className="buy" href={book.amazonUrl} target="_blank" rel="noopener">
                Buy on Amazon
              </a>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
