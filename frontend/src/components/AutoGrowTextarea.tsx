import { useEffect, useRef } from "react";
import type { TextareaHTMLAttributes } from "react";

// A textarea that grows with its content up to `maxRows` lines (default 3) and
// then scrolls with a visible scrollbar. Used everywhere instead of a plain
// <textarea> so multi-line inputs behave consistently across the app.
export default function AutoGrowTextarea({
  maxRows = 3,
  className = "input",
  value,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { maxRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize(el: HTMLTextAreaElement) {
    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const borderY = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const maxHeight = lineHeight * maxRows + paddingY + borderY;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }

  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, [value]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      rows={1}
      className={`${className} resize-none auto-scrollbar`}
      onInput={(event) => resize(event.currentTarget)}
    />
  );
}
