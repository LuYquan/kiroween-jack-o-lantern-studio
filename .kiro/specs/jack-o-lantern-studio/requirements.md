# Jack-o'-Lantern Studio — Requirements

Requirements follow EARS style: **WHEN** \<trigger\> **the system SHALL** \<response\>.

---

## 1. Canvas and Pumpkin Rendering

**REQ-01** The system SHALL draw a pumpkin (orange body, ribbed segments, green stem) on the canvas on every page load, before any user interaction.

**REQ-02** WHEN the viewport is resized, the system SHALL redraw the pumpkin and all existing carvings at the new canvas dimensions without loss of carving state.

**REQ-03** The system SHALL never display a blank or empty canvas; the pumpkin body SHALL be visible at all times.

---

## 2. Carving Tools — Stamp Mode

**REQ-04** The system SHALL provide the following stamp shapes selectable from a tool palette:
- Triangle Eyes (pair)
- Round Eyes (pair)
- Crooked Eyes (pair)
- Nose (small triangle)
- Classic Grin (arc)
- Toothy Grin (arc with rectangular teeth)
- Frown (downward arc)
- Star
- Crescent Moon

**REQ-05** WHEN the user selects a stamp tool and clicks within the pumpkin body, the system SHALL cut that shape into the pumpkin at the click position using canvas compositing (`destination-out`).

**REQ-06** WHEN a stamp is placed, the system SHALL record the stamp (shape type and position) in the carving state so it can be redrawn after any canvas resize or mode change.

---

## 3. Freehand Carve Tool

**REQ-07** The system SHALL provide a Freehand Carve tool that activates a draw mode on the canvas.

**REQ-08** WHEN the Freehand Carve tool is active and the user presses and drags the pointer across the pumpkin, the system SHALL cut a continuous freehand path into the pumpkin surface.

**REQ-09** WHEN the pointer is released, the system SHALL close the current freehand stroke and commit it to the carving state.

---

## 4. Erase Tool

**REQ-10** The system SHALL provide an Erase tool.

**REQ-11** WHEN the Erase tool is active and the user clicks or drags on a carved area, the system SHALL restore pumpkin flesh at that location (remove carvings within the eraser radius).

**REQ-12** The eraser SHALL remove recorded stamps and freehand strokes that fall within its area of effect, then redraw the canvas from the updated state.

---

## 5. Candle Glow and Flicker

**REQ-13** The system SHALL render a warm candle glow visible through every carved opening.

**REQ-14** The glow SHALL be rendered as a radial gradient centered on the pumpkin, composited so that only carved-out pixels show the light.

**REQ-15** The system SHALL animate the glow with a flicker effect: the glow radius and opacity SHALL vary on a randomised cycle (target ~12 fps update) to simulate a real candle flame.

**REQ-16** WHEN no carvings are present, the glow animation SHALL still run internally but no light SHALL be visible (because there are no transparent pixels for it to show through).

---

## 6. Day / Night Toggle

**REQ-17** The system SHALL provide a Day/Night toggle control.

**REQ-18** WHEN the toggle is set to Night, the system SHALL darken the page background to near-black and reduce ambient light on the pumpkin so that the candle glow becomes the dominant light source.

**REQ-19** WHEN the toggle is set to Day, the system SHALL restore the page to its default lit background and normal pumpkin colours.

**REQ-20** The day/night state SHALL persist across canvas redraws within the session.

---

## 7. Preset Faces

**REQ-21** The system SHALL provide at least four named preset faces: Classic, Spooky, Silly, and Wicked.

**REQ-22** Each preset SHALL be defined as a fixed list of stamp placements (shape type and normalised position).

**REQ-23** WHEN the user selects a preset, the system SHALL replace the current carving state with the preset's stamp list and redraw the canvas.

---

## 8. Random Face Generator ("Haunt me")

**REQ-24** The system SHALL provide a "Haunt me" button.

**REQ-25** WHEN the user clicks "Haunt me", the system SHALL randomly select a subset of stamps from the available shapes, place them at plausible positions on the pumpkin face, and redraw the canvas.

**REQ-26** Each invocation of "Haunt me" SHALL produce a different face with reasonable probability (not the same face twice in a row).

---

## 9. Glow Colour Picker

**REQ-27** The system SHALL provide a glow colour selector with at least four options: Orange, Green, Purple, Blood Red.

**REQ-28** WHEN the user selects a glow colour, the system SHALL update the radial gradient used for candle glow to the chosen colour and redraw immediately.

**REQ-29** The selected glow colour SHALL persist across canvas redraws and mode changes within the session.

---

## 10. PNG Export

**REQ-30** The system SHALL provide an "Export PNG" button.

**REQ-31** WHEN the user clicks "Export PNG", the system SHALL call `canvas.toDataURL('image/png')` and trigger a file download named `jack-o-lantern.png`.

**REQ-32** The exported PNG SHALL reflect the current canvas state including day/night mode and glow colour.

---

## 11. Preset Gallery Strip

**REQ-33** The system SHALL display a horizontal gallery strip showing thumbnail previews of all four preset faces.

**REQ-34** Each thumbnail SHALL be rendered as a small canvas using the same drawing logic as the main canvas.

**REQ-35** WHEN the user clicks a gallery thumbnail, the system SHALL apply that preset to the main canvas (same behaviour as REQ-23).

---

## 12. Empty State

**REQ-36** WHEN no carvings have been made, the system SHALL display hint text reading "Click a tool, then click the pumpkin to carve" overlaid below the canvas or as a subtitle.

**REQ-37** WHEN at least one carving is present, the system SHALL hide the hint text.

---

## 13. Responsive Layout

**REQ-38** The system SHALL render correctly at viewport widths from 390 px to 1440 px.

**REQ-39** At widths below 600 px, the tool palette and controls SHALL reflow to a single-column layout below the canvas.

**REQ-40** The canvas SHALL scale to fit the available width while maintaining its aspect ratio.

---

## 14. No-Blank-Screen Guarantee

**REQ-41** The system SHALL draw the pumpkin synchronously on `DOMContentLoaded`, before any animation frame or async operation completes.

**REQ-42** If the browser does not support the Canvas 2D API, the system SHALL display a fallback message: "Your browser does not support canvas. Please try a modern browser."
