import { useEffect, useRef } from "react";

/**
 * Cycles through `images`, transitioning between them with a retro pixelate
 * (mosaic) dissolve: the current image breaks into ever larger blocks, then
 * the next image resolves back from blocks. Rendered on a single <canvas>.
 */
export default function PixelSlideshow({
  images,
  className,
  hold = 3000,
  fade = 520
}: {
  images: string[];
  className?: string;
  hold?: number;
  fade?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    if (!octx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let imgs: HTMLImageElement[] = [];
    let idx = 0;
    let raf = 0;
    let phaseStart = 0;
    let advanced = false;
    let cancelled = false;

    function fit() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = Math.max(1, Math.round(rect.width * dpr));
      canvas!.height = Math.max(1, Math.round(rect.height * dpr));
    }

    function drawCover(c: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
      if (!img.width || !img.height) return;
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      c.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }

    // level: 1 = sharp, 0 = heavily pixelated.
    function render(img: HTMLImageElement, level: number) {
      const W = canvas!.width;
      const H = canvas!.height;
      const f = 0.03 + Math.max(0, Math.min(1, level)) * 0.97;
      const ow = Math.max(1, Math.round(W * f));
      const oh = Math.max(1, Math.round(H * f));
      off.width = ow;
      off.height = oh;
      octx!.imageSmoothingEnabled = true;
      octx!.clearRect(0, 0, ow, oh);
      drawCover(octx!, img, ow, oh);
      ctx!.imageSmoothingEnabled = false;
      ctx!.clearRect(0, 0, W, H);
      ctx!.drawImage(off, 0, 0, ow, oh, 0, 0, W, H);
    }

    function frame(now: number) {
      if (cancelled) return;
      if (!phaseStart) phaseStart = now;
      const el = now - phaseStart;

      if (imgs.length <= 1) {
        render(imgs[0], 1);
        return;
      }
      if (el < hold) {
        render(imgs[idx], 1);
        advanced = false;
      } else if (el < hold + fade) {
        render(imgs[idx], 1 - (el - hold) / fade);
      } else if (el < hold + fade * 2) {
        if (!advanced) {
          idx = (idx + 1) % imgs.length;
          advanced = true;
        }
        render(imgs[idx], (el - hold - fade) / fade);
      } else {
        phaseStart = now;
        render(imgs[idx], 1);
      }
      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas);

    Promise.all(
      images.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => resolve(im);
            im.src = src;
          })
      )
    ).then((loaded) => {
      if (cancelled) return;
      imgs = loaded.filter((im) => im.width > 0);
      fit();
      if (imgs.length) raf = requestAnimationFrame(frame);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [images, hold, fade]);

  return <canvas ref={ref} className={className} role="img" aria-label="Car dashboard navigation" />;
}
