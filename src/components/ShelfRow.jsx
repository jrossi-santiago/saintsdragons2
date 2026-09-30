import Spine from "./Spine.jsx";

export default function ShelfRow({ name, books, onOpen }) {
  return (
    <section className="row" aria-label={name}>
      <h2 className="row-label">{name}</h2>
      <div className="row-scroll">
        <ul className="spines">
          {books.map((b) => (
            <li key={b.id}>
              <Spine book={b} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
