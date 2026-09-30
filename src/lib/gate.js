const KEY = "getLostShelf";

export function isUnlocked() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function unlock() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode: the router state still lets this session through */
  }
}
