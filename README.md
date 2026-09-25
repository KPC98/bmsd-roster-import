# BMSD Roster Import — Figma Plugin

Imports team roster photos into a Figma file as instances of your `Comp` component set.

## Install (each teammate, once)

1. Figma desktop → **Plugins → Development → Import plugin from manifest…**
2. Select this folder's `manifest.json`

## Requirements in the Figma file

- A **component set named exactly `Comp`** with variants `Players=4`, `Players=5`, `Players=6`
  (horizontal row of 1000×1000 image slots). Teams whose size has no variant are skipped
  and reported in the completion message.

## Use

1. Run **Plugins → Development → BMSD Roster Import**
2. Click **Select roster folder…** and pick the folder that contains one sub-folder per team,
   player photos as PNGs inside:

   ```
   roster/
     GODL/
       GodLADmiNO.png
       GodLGOdz.png
       ...
     RCE/
       GoSoloRCFLAsH.png
       ...
   ```

3. Wait for "Importing into Figma…" — done. One instance per team is stacked below the
   `Comp` set, named after the team, slots filled and renamed per player.

Photos larger than 1000px are automatically downscaled in the plugin (Figma rejects images
above 4096px).

## Notes

- No server, no network access, no external dependencies — works offline.
- The folder name becomes the instance name; the PNG file name (minus `.png`) becomes the slot name.

## Roadmap

- **V2** — Player photo UI scale & alignment controls for better compositions
  (per-slot zoom/pan preview before import).
