# BMSD Roster Import — Figma Plugin

Imports team roster photos into a Figma file as instances of your `Comp` component set.

## Install (each teammate, once)

1. Figma desktop → **Plugins → Development → Import plugin from manifest…**
2. Select this folder's `manifest.json`

## Requirements in the Figma file

- **None.** If the file has a component set named `Comp`, it is used. If not, the plugin
  creates it: variants `Players=4/5/6`, horizontal row of 1000×1000 slots with the BMSD
  overlap spacings (-550/-610/-659). If a team has a size with no existing variant
  (e.g. 7 players), the plugin adds that variant to the set automatically.

## Preparing your files

The plugin reads a folder where **each team is a sub-folder** and **each player is one PNG**
named exactly by their in-game name (IGN):

```
roster/
  GODL/                     <- team folder = instance name in Figma
    GodLADmiNO.png          <- file name (minus .png) = slot name
    GodLGOdz.png
    GodLSpoweRR1.png
    GodLManYAA.png
    GodLSAUmay.png
  RCE/
    GoSoloRCFLAsH.png
    ...
```

Rules:

- **PNG only.** Other formats are ignored.
- **Team size must be 4, 5, or 6 players** — the `Comp` set has one variant per size.
  Teams with any other count are skipped and listed in the completion message.
- **File name = player IGN.** Use the exact tournament IGN; it becomes the layer name in Figma.
- Team folder names are used verbatim as instance names — keep them short (e.g. `GODL`, `RCE`).
- Sub-folders inside team folders are ignored; only PNGs directly inside count.
- Photos are auto-downscaled to 1000px on import (Figma rejects images above 4096px), so
  full-resolution exports are fine. For big batches (300+ photos) give the import a minute.

## Use

1. Open the Figma file (it needs a `Comp` component set — the plugin creates one if missing).
2. Run **Plugins → Development → BMSD Roster Import**.
3. Click **Select roster folder…** and pick the roster folder prepared as above.
4. Wait for "Importing into Figma…" — done. One instance per team is stacked below the
   `Comp` set, named after the team, slots filled and renamed per player.

Photos larger than 1000px are automatically downscaled in the plugin (Figma rejects images
above 4096px).

## Notes

- No server, no network access, no external dependencies — works offline.
- The folder name becomes the instance name; the PNG file name (minus `.png`) becomes the slot name.

## Changelog

- **v1.1** — Plugin creates the `Comp` component set when missing; auto-adds variants
  for roster sizes not yet in the set.
- **v1.0** — Initial release.

## Roadmap

- **V2** — Player photo UI scale & alignment controls for better compositions
  (per-slot zoom/pan preview before import).
