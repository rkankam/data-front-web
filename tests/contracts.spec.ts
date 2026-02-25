import { describe, expect, it } from "vitest";

import catalogFullInvalid from "./fixtures/catalog-full.invalid.json";
import catalogFullValid from "./fixtures/catalog-full.valid.json";
import catalogLiteInvalid from "./fixtures/catalog-lite.invalid.json";
import catalogLiteValid from "./fixtures/catalog-lite.valid.json";
import signUrlInvalid from "./fixtures/sign-url.invalid.json";
import signUrlValid from "./fixtures/sign-url.valid.json";

import {
  apiErrorSchema,
  catalogFullSchema,
  catalogLiteSchema,
  signUrlSuccessSchema,
} from "../src/lib/contracts";

describe("contracts", () => {
  it("accepts valid catalog-lite payload", () => {
    const result = catalogLiteSchema.safeParse(catalogLiteValid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid catalog-lite payload", () => {
    const result = catalogLiteSchema.safeParse(catalogLiteInvalid);
    expect(result.success).toBe(false);
  });

  it("accepts valid catalog-full payload", () => {
    const result = catalogFullSchema.safeParse(catalogFullValid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid catalog-full payload", () => {
    const result = catalogFullSchema.safeParse(catalogFullInvalid);
    expect(result.success).toBe(false);
  });

  it("accepts valid sign-url payload", () => {
    const result = signUrlSuccessSchema.safeParse(signUrlValid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid sign-url payload", () => {
    const result = signUrlSuccessSchema.safeParse(signUrlInvalid);
    expect(result.success).toBe(false);
  });

  it("accepts canonical error payload", () => {
    const result = apiErrorSchema.safeParse({ error: "Catalog fetch failed" });
    expect(result.success).toBe(true);
  });

  it("rejects malformed error payload", () => {
    const result = apiErrorSchema.safeParse({ error: "" });
    expect(result.success).toBe(false);
  });
});
