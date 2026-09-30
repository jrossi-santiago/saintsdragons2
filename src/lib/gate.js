const KEY = "getLostShelf";
const YEAR = 60 * 60 * 24 * 365;

function cookieSet() {
  try {
    return document.cookie.split("; ").some((c) => c === `${KEY}=1`);
  } catch {
    return false;
  }
}

// localStorage is the gate. A year-long first-party cookie is a backup for browsers
// that clear one but not the other; if either survives, the visitor is let back in.
export function isUnlocked() {
  try {
    if (localStorage.getItem(KEY) === "1") return true;
  } catch {
    /* blocked storage: fall through to the cookie */
  }
  if (cookieSet()) {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

export function unlock() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${KEY}=1; max-age=${YEAR}; path=/; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}
