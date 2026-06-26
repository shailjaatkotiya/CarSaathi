import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router keeps the previous scroll position across navigations, so a page
// opened from a scrolled list (ride details, driver/passenger profile) would
// otherwise appear scrolled to the bottom. Reset to the top on every route
// change. useLayoutEffect runs before paint so the new page never flashes at the
// old scroll position.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Disable the browser's own scroll restoration so it can't fight this.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
