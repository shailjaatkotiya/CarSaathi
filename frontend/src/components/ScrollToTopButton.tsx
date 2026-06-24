import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

// Small floating caret shown only on mobile when the page is scrollable and the
// user has scrolled down. Tapping it jumps back to the top of the page.
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight > 80;
      setVisible(scrollable && window.scrollY > 240);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-5 z-40 grid h-10 w-10 place-items-center rounded-full bg-primary text-white shadow-lg ring-1 ring-black/5 transition hover:bg-primary-dark md:hidden"
    >
      <ChevronUp size={20} />
    </button>
  );
}
