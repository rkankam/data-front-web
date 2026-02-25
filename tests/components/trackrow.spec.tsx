import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TrackRow } from "../../src/components/TrackRow";
import type { QueueTrack } from "../../src/lib/player/store";

const track: QueueTrack = {
  id: "1",
  title: "Track One",
  durationSeconds: 120,
  imageUrl: null,
  createdAt: null,
  model: "Model A",
  audio: { publicUrl: null, b2Mp3Key: null, b2WavKey: null },
  tags: { sound: "club", conditions: [] },
};

describe("TrackRow", () => {
  it("triggers select and add next actions", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onAddNext = vi.fn();

    render(
      <TrackRow
        track={track}
        active={false}
        onSelect={onSelect}
        onAddNext={onAddNext}
        durationLabel="2:00"
      />
    );

    await user.click(screen.getByLabelText("Play Track One"));
    await user.click(screen.getByLabelText("Add Track One next"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onAddNext).toHaveBeenCalledTimes(1);
  });
});
