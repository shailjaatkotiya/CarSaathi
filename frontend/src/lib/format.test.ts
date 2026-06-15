import { describe, expect, it } from "vitest";
import { formatTimeAmPm, whatsappLink } from "./format";

describe("formatTimeAmPm", () => {
  it("formats morning and evening 24h times to AM/PM", () => {
    expect(formatTimeAmPm("07:30:00")).toBe("7:30 AM");
    expect(formatTimeAmPm("18:05")).toBe("6:05 PM");
    expect(formatTimeAmPm("00:00")).toBe("12:00 AM");
    expect(formatTimeAmPm("12:00")).toBe("12:00 PM");
  });
});

describe("whatsappLink", () => {
  it("prefixes a 10-digit Indian number with 91", () => {
    expect(whatsappLink("9876543210")).toBe("https://wa.me/919876543210");
  });
  it("keeps an already-prefixed number", () => {
    expect(whatsappLink("+91 98765 43210")).toBe("https://wa.me/919876543210");
  });
  it("returns null for empty input", () => {
    expect(whatsappLink("")).toBeNull();
    expect(whatsappLink(null)).toBeNull();
  });
});
