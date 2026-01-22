const COOKIE_NAME = import.meta.env.VITE_COOKIE_NAME || "user_id";
const COOKIE_MAX_AGE = Number(import.meta.env.VITE_COOKIE_MAX_AGE || 60 * 60 * 24 * 30);

export const applyCookieFromQuery = () => {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  const override = url.searchParams.get("cookie");
  if (!override) return false;
  let cookie = `${COOKIE_NAME}=${encodeURIComponent(override)}; Path=/; SameSite=Lax`;
  if (Number.isFinite(COOKIE_MAX_AGE) && COOKIE_MAX_AGE > 0) {
    cookie += `; Max-Age=${Math.floor(COOKIE_MAX_AGE)}`;
  }
  document.cookie = cookie;
  const redirectUrl = url.origin + url.pathname;
  if (window.location.href !== redirectUrl) {
    window.location.replace(redirectUrl);
    return true;
  }
  return false;
};

export const clearUserCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
};
