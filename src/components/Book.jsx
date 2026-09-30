import { memo, useEffect, useRef, useState } from "react";

// Resolve the first image that really loads. Amazon answers missing covers with a 1x1 gif.
function probe(urls, done) {
  let live = true;
  (function next(i) {
    if (!live) return;
    if (i >= urls.length) return done(null);
    const im = new Image();
    im.referrerPolicy = "no-referrer";
    im.onload = () => (im.naturalWidth > 1 ? live && done(urls[i]) : next(i + 1));
    im.onerror = () => next(i + 1);
    im.src = urls[i];
  })(0);
  return () => (live = false);
}

// One front cover on the shelf. The box is a fixed 3:4 from the first paint, so nothing
// jumps when the image arrives; until then (or if none loads) a typographic cover fills it.
function Book({ book, onOpen }) {
  const btn = useRef(null);
  const [near, setNear] = useState(false);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    const el = btn.current;
    if (!("IntersectionObserver" in window)) return setNear(true);
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setNear(true), io.disconnect()),
      { rootMargin: "700px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => (near ? probe(book.images, setSrc) : undefined), [near, book.images]);

  return (
    <button
      ref={btn}
      type="button"
      className="book"
      style={{ "--c": book.spineColor }}
      title={book.title}
      aria-label={book.title}
      onClick={(e) => onOpen(book, e.currentTarget)}
    >
      <span className="cover">
        {src ? (
          <img src={src} alt="" referrerPolicy="no-referrer" draggable="false" />
        ) : (
          <span className="typo">
            <span>{book.title}</span>
            {book.author && <em>{book.author}</em>}
          </span>
        )}
      </span>
    </button>
  );
}

export default memo(Book);
