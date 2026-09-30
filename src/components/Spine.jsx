import { memo } from "react";
import { spineModel } from "../lib/spine.js";

// One upright spine. `onOpen` makes it a real button; without it it is decoration.
function Spine({ book, onOpen }) {
  const m = spineModel(book);
  const style = {
    "--w": `${m.width}px`,
    "--h": `${m.height}px`,
    "--c": book.spineColor,
    "--ink": m.ink,
    "--lean": `${m.lean}deg`,
  };
  const face = (
    <span className="spine-text">
      <span className="spine-title" style={{ fontSize: m.fontSize }}>
        {m.title}
      </span>
      {m.author && <span className="spine-author">{m.author}</span>}
    </span>
  );

  if (!onOpen) {
    return (
      <span className={`spine band-${m.band}`} style={style} aria-hidden="true">
        {face}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`spine band-${m.band}`}
      style={style}
      title={book.title}
      aria-label={book.title}
      onClick={(e) => onOpen(book, e.currentTarget)}
    >
      {face}
    </button>
  );
}

export default memo(Spine);
