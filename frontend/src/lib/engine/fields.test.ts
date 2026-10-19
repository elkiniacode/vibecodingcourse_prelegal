import { describe, expect, it } from "vitest";
import { createFieldResolver, defaultValues, isFieldVisible, resolveField } from "./fields";
import type { FieldDefinition } from "./model";

const name: FieldDefinition = { id: "name", kind: "text", group: "Party", label: "Name" };
const notes: FieldDefinition = {
  id: "notes",
  kind: "textarea",
  group: "Terms",
  label: "Notes",
  emptyText: "None.",
};
const start: FieldDefinition = {
  id: "start",
  kind: "date",
  group: "Terms",
  label: "Start",
  defaultsToToday: true,
};
const years: FieldDefinition = {
  id: "years",
  kind: "number",
  group: "Terms",
  label: "Years",
  defaultValue: "1",
  unit: { singular: "year", plural: "years" },
  showWhen: { fieldId: "term", equals: "fixed" },
};
const term: FieldDefinition = {
  id: "term",
  kind: "choice",
  group: "Terms",
  label: "Term",
  defaultValue: "fixed",
  options: [
    { value: "fixed", label: "Fixed term" },
    { value: "open", label: "Open ended" },
  ],
};

describe("resolveField", () => {
  it("trims text values", () => {
    expect(resolveField(name, "  Ada Lovelace ")).toEqual({
      label: "Name",
      text: "Ada Lovelace",
      filled: true,
    });
  });

  it("marks empty or blank values as unfilled but keeps the label for the placeholder", () => {
    expect(resolveField(name, "   ")).toEqual({ label: "Name", text: "", filled: false });
    expect(resolveField(name)).toEqual({ label: "Name", text: "", filled: false });
  });

  it("shows emptyText for optional fields left empty", () => {
    expect(resolveField(notes, "")).toEqual({ label: "Notes", text: "None.", filled: true });
    expect(resolveField(notes, "Clause 3 removed")).toMatchObject({ text: "Clause 3 removed" });
  });

  it("formats dates, numbers and choices", () => {
    expect(resolveField(start, "2026-10-18").text).toBe("October 18, 2026");
    expect(resolveField(years, "2").text).toBe("2 years");
    expect(resolveField(term, "open").text).toBe("Open ended");
  });

  it("treats values that can't be formatted as unfilled", () => {
    expect(resolveField(start, "2026-02-30").filled).toBe(false);
    expect(resolveField(years, "0").filled).toBe(false);
    expect(resolveField(term, "unknown").filled).toBe(false);
  });
});

describe("createFieldResolver", () => {
  const resolve = createFieldResolver([name, years], { name: "Ada", years: "1" });

  it("resolves fields by id", () => {
    expect(resolve("name").text).toBe("Ada");
    expect(resolve("years").text).toBe("1 year");
  });

  it("throws for a field the definition doesn't have", () => {
    expect(() => resolve("missing")).toThrow('Unknown field "missing"');
  });
});

describe("isFieldVisible", () => {
  it("shows fields without a condition", () => {
    expect(isFieldVisible(name, {})).toBe(true);
  });

  it("shows conditional fields only while the condition holds", () => {
    expect(isFieldVisible(years, { term: "fixed" })).toBe(true);
    expect(isFieldVisible(years, { term: "open" })).toBe(false);
  });
});

describe("defaultValues", () => {
  it("uses each field's default, today for today-dated fields, and empty otherwise", () => {
    expect(defaultValues([name, notes, start, years, term], "2026-10-18")).toEqual({
      name: "",
      notes: "",
      start: "2026-10-18",
      years: "1",
      term: "fixed",
    });
  });

  it("leaves today-dated fields empty while today is unknown", () => {
    expect(defaultValues([start], "")).toEqual({ start: "" });
  });
});
