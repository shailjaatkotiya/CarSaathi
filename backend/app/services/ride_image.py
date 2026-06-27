"""Generates Black & White share-card PNGs for published rides and bookings.

The card theme mirrors the Carthi app palette (tailwind.config.ts):
white background, black header/footer bands, ink text, sand dividers,
muted-grey labels. Images are written under settings.media_root and a
publicly reachable URL is returned for WhatsApp (Twilio media) delivery.
"""

from __future__ import annotations

import logging
import os
from uuid import uuid4

from PIL import Image, ImageDraw, ImageFont

from app.core.config import get_settings

logger = logging.getLogger("carthi.ride_image")

# Palette pulled from the app theme (B&W).
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
INK = (23, 23, 23)
MUTED = (107, 114, 128)
SAND = (229, 229, 229)

WIDTH = 1080
HEIGHT = 1280
PAD = 72

# System font candidates: Windows first, then common Linux paths.
_REGULAR_FONTS = [
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/Library/Fonts/Arial.ttf",
]
_BOLD_FONTS = [
    "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
]


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    for path in _BOLD_FONTS if bold else _REGULAR_FONTS:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    # Pillow >= 10 scales its built-in font; keeps cards readable everywhere.
    return ImageFont.load_default(size)


def _text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> int:
    return int(draw.textlength(text, font=font))


def _fit_font(
    draw: ImageDraw.ImageDraw, text: str, max_width: int, size: int, bold: bool
) -> ImageFont.FreeTypeFont:
    """Shrink the font until the text fits inside max_width."""
    while size > 18:
        font = _font(size, bold)
        if _text_width(draw, text, font) <= max_width:
            return font
        size -= 4
    return _font(size, bold)


def _draw_pill(
    draw: ImageDraw.ImageDraw, text: str, right: int, top: int
) -> None:
    font = _font(26, bold=True)
    tw = _text_width(draw, text, font)
    pad_x, pad_y, h = 24, 14, 56
    left = right - (tw + pad_x * 2)
    draw.rounded_rectangle(
        [left, top, right, top + h], radius=h // 2, fill=WHITE
    )
    draw.text((left + pad_x, top + pad_y), text, font=font, fill=BLACK)


def _draw_pairs(
    draw: ImageDraw.ImageDraw, pairs: list[tuple[str, str]], start_y: int
) -> int:
    """Two-column label/value grid. Returns the y just below the grid."""
    col_w = (WIDTH - PAD * 2) // 2
    row_h = 124
    label_font = _font(24, bold=True)
    y = start_y
    for index, (label, value) in enumerate(pairs):
        col = index % 2
        x = PAD + col * col_w
        if col == 0 and index > 0:
            y += row_h
        draw.text((x, y), label.upper(), font=label_font, fill=MUTED)
        value_font = _fit_font(draw, value, col_w - 24, 44, bold=True)
        draw.text((x, y + 34), value, font=value_font, fill=INK)
    return y + row_h


def _render(
    headline: str,
    pill: str,
    route: str,
    pairs: list[tuple[str, str]],
    footer: str,
    filename: str,
) -> tuple[str, str] | None:
    settings = get_settings()
    try:
        image = Image.new("RGB", (WIDTH, HEIGHT), WHITE)
        draw = ImageDraw.Draw(image)

        # Header band.
        header_h = 200
        draw.rectangle([0, 0, WIDTH, header_h], fill=BLACK)
        draw.text((PAD, 56), "Carthi", font=_font(72, bold=True), fill=WHITE)
        draw.text(
            (PAD + 4, 142),
            "VERIFIED GUJARAT CARPOOLING",
            font=_font(24, bold=True),
            fill=SAND,
        )
        _draw_pill(draw, pill, WIDTH - PAD, 64)

        # Headline + route.
        draw.text((PAD, header_h + 56), headline, font=_font(56, bold=True), fill=INK)
        draw.text(
            (PAD, header_h + 150), "ROUTE", font=_font(24, bold=True), fill=MUTED
        )
        route_font = _fit_font(draw, route, WIDTH - PAD * 2, 60, bold=True)
        draw.text((PAD, header_h + 186), route, font=route_font, fill=INK)

        # Divider.
        line_y = header_h + 286
        draw.line([PAD, line_y, WIDTH - PAD, line_y], fill=SAND, width=3)

        # Detail grid.
        _draw_pairs(draw, pairs, line_y + 40)

        # Footer band.
        footer_h = 96
        draw.rectangle([0, HEIGHT - footer_h, WIDTH, HEIGHT], fill=BLACK)
        draw.text(
            (PAD, HEIGHT - footer_h + 30),
            footer,
            font=_font(30, bold=True),
            fill=WHITE,
        )
        tagline = "carthi · share & ride"
        tag_font = _font(26, bold=True)
        draw.text(
            (WIDTH - PAD - _text_width(draw, tagline, tag_font), HEIGHT - footer_h + 32),
            tagline,
            font=tag_font,
            fill=SAND,
        )

        rides_dir = os.path.join(settings.media_root, "cards")
        os.makedirs(rides_dir, exist_ok=True)
        path = os.path.join(rides_dir, filename)
        image.save(path, format="PNG")
        url = f"{settings.public_media_base_url.rstrip('/')}/cards/{filename}"
        return path, url
    except Exception:  # noqa: BLE001 - image generation must never break the caller
        logger.exception("ride card generation failed: %s", filename)
        return None


def _fmt_time(value) -> str:
    try:
        return value.strftime("%I:%M %p").lstrip("0")
    except Exception:  # noqa: BLE001
        return str(value)


def _fmt_date(value) -> str:
    try:
        return value.strftime("%d %b %Y")
    except Exception:  # noqa: BLE001
        return str(value)


def generate_ride_published_card(ride) -> tuple[str, str] | None:
    """B&W card for a newly published ride (sent to the driver)."""
    vehicle = ride.vehicle
    car = f"{vehicle.brand} {vehicle.model}".strip() if vehicle else "-"
    pairs = [
        ("Date", _fmt_date(ride.journey_date)),
        ("Departure", _fmt_time(ride.departure_time)),
        ("Seats", str(ride.available_seats)),
        ("Price / seat", f"Rs. {ride.price_per_seat}"),
        ("Car", car or "-"),
        ("Vehicle no.", (vehicle.vehicle_number if vehicle else "-") or "-"),
    ]
    return _render(
        headline="Ride published",
        pill="PUBLISHED",
        route=f"{ride.source_city}  to  {ride.destination_city}",
        pairs=pairs,
        footer=f"Ride #{ride.id}",
        filename=f"ride_{ride.id}_{uuid4().hex[:8]}.png",
    )


def generate_booking_card(booking) -> tuple[str, str] | None:
    """B&W card for a booking (sent to the passenger)."""
    ride = booking.ride
    vehicle = ride.vehicle
    driver = ride.driver
    car = f"{vehicle.brand} {vehicle.model}".strip() if vehicle else "-"
    pairs = [
        ("Date", _fmt_date(ride.journey_date)),
        ("Departure", _fmt_time(ride.departure_time)),
        ("Seats", str(booking.seats_booked)),
        ("Amount", f"Rs. {booking.total_amount}"),
        ("Pickup", booking.pickup_point or "-"),
        ("Drop", booking.drop_point or "-"),
        ("Driver", (driver.full_name if driver else "-") or "-"),
        ("Car", car or "-"),
    ]
    return _render(
        headline=f"Booking {booking.status.value}",
        pill="BOOKING",
        route=f"{ride.source_city}  to  {ride.destination_city}",
        pairs=pairs,
        footer=f"Booking {booking.booking_code}",
        filename=f"booking_{booking.id}_{uuid4().hex[:8]}.png",
    )
