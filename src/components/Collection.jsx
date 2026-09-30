import { useEffect, useState } from "react";
import Book from "./Book.jsx";

const columns = () => {
  const w = window.innerWidth;
  return w >= 1000 ? 5 : w >= 720 ? 4 : w >= 480 ? 3 : 2;
};

export function useColumns() {
  const [n, setN] = useState(columns);
  useEffect(() => {
    const on = () => setN(columns());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return n;
}

// A labeled stretch of shelf: covers in rows of n, each row standing on its own line.
export default function Collection({ name, books, n, onOpen }) {
  const rows = [];
  for (let i = 0; i < books.length; i += n) rows.push(books.slice(i, i + n));
  return (
    <section className="collection" aria-label={name}>
      <h2 className="row-label">{name}</h2>
      {rows.map((row, i) => (
        <ul key={i} className="covers" style={{ "--n": n }}>
          {row.map((b) => (
            <li key={b.id}>
              <Book book={b} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      ))}
    </section>
  );
}
