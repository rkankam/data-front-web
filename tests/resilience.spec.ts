import { describe, expect, it, vi } from "vitest";

import { GET as getCatalog } from "../src/app/api/catalog/route";
import { defaultFilters, searchTracks } from "../src/lib/search/engine";

describe("resilience checks", () => {
  it("search handles empty dataset", () => {
    const result = searchTracks([], defaultFilters);
    expect(result).toEqual([]);
  });

  it("catalog route returns 502 on upstream failure", async () => {
    process.env.B2_KEY_ID = "id";
    process.env.B2_APPLICATION_KEY = "key";
    process.env.B2_BUCKET_ID = "bucket-id";
    process.env.B2_BUCKET_NAME = "bucket-name";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "fail" }), { status: 500 })
    );

    const response = await getCatalog(new Request("http://localhost/api/catalog?file=index/catalog-lite.json"));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toContain("Upstream request failed: 500");
  });
});
