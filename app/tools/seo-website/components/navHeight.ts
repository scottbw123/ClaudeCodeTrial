/**
 * Returns the combined height (px) of all sticky nav bars so scroll sections
 * can be sized and positioned to start exactly below the nav on any device.
 */
export function getNavHeight(): number {
  if (typeof window === "undefined") return 56;
  const nav = document.getElementById("site-nav");
  return nav ? nav.getBoundingClientRect().height : 56;
}
