import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { MetadataPanel } from "../../src/components/MetadataPanel";
import { SearchBar } from "../../src/components/SearchBar";

describe("a11y checks", () => {
  it("search bar has no violations", async () => {
    const { container } = render(<SearchBar value="" onChange={() => undefined} />);
    const result = await axe(container);
    expect(result.violations).toHaveLength(0);
  });

  it("metadata panel has no violations", async () => {
    const { container } = render(<MetadataPanel track={null} isFavorite={false} />);
    const result = await axe(container);
    expect(result.violations).toHaveLength(0);
  });
});
