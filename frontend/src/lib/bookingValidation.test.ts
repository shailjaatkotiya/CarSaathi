import { describe, expect, it } from "vitest";
import { validatePassengerEntries } from "./bookingValidation";

describe("validatePassengerEntries", () => {
  it("rejects a booking when selected seats do not match completed passenger details", () => {
    const entries = [
      { savedId: "", full_name: "A", age: "", gender: "", save: false },
      { savedId: "", full_name: "", age: "", gender: "", save: false },
      { savedId: "", full_name: "C", age: "", gender: "", save: false },
    ];

    const result = validatePassengerEntries(entries, []);

    expect(result).toBe("Please fill in passenger details for all selected seats.");
  });

  it("allows a fully matched booking with saved passengers", () => {
    const entries = [
      { savedId: "1", full_name: "A", age: "", gender: "", save: false },
      { savedId: "2", full_name: "B", age: "", gender: "", save: false },
    ];

    const result = validatePassengerEntries(entries, [
      { id: 1, full_name: "A", age: 20, gender: "Female", phone: "" },
      { id: 2, full_name: "B", age: 25, gender: "Male", phone: "" },
    ]);

    expect(result).toBeNull();
  });
});
