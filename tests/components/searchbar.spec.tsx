import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchBar } from "../../src/components/SearchBar";

describe("SearchBar", () => {
  it("emits changes", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Search tracks"), { target: { value: "jazz" } });
    expect(onChange).toHaveBeenCalledWith("jazz");
  });
});
