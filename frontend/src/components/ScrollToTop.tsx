import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router keeps the previous scroll position across navigations, so a page
// opened from a scrolled list (ride details, driver/passenger profile) would
// otherwise appear scrolled to the bottom. Reset to the top on every route change.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
