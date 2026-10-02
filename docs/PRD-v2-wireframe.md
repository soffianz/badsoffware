# PRD v2: BBC26 wireframe restyle

Restyle only. Same app, same data, same db. The goal is a lighter, plainer page that looks like a wireframe built in raw HTML, with each of the three users seeing it in their own colour.

## 1. Goals

1. Wireframe look: boxes, rules, plain text, default-looking controls.
2. One colour per person. Each viewer sees the whole UI in their own colour.
3. Small and cheap: no photos, no web fonts, no decorative graphics. Fewer bytes to load, less code to maintain.

## 2. Non-goals

- No change to the data model, the seed data, or how sync, offline cache and change dots work.
- No new features.

## 3. Colour per person

| Crew | Colour | Hex (light) | Text on colour |
|---|---|---|---|
| SF (Soff) | Green | `#1B7F3B` | white |
| AR (Arif) | Blue | `#1F5FBF` | white |
| SH (Shereef) | Yellow | `#F2C200` | black |

Assumption: SF green, AR blue, SH yellow, matching the order you listed. Say if you want it shuffled.

Rules:
- The viewer's colour fills the header bar, the active tab, primary buttons and the focus outline. It is also the border colour of the main box on each screen.
- Everything else is black and white (or the dark equivalents). No other accent colours.
- Seals (SF, AR, SH) always use each person's own colour, on every screen, for everyone. A spend paid by AR shows a blue AR seal even on Soff's phone.
- Before someone picks who they are, the UI is plain grey. Picking SF, AR or SH on the "Which one are you?" screen switches the colour. Re-binding in settings switches it again.
- Phase is shown as a text label only. The five phase accent colours are dropped.
- Yellow is never used as text colour on white. It is a fill or border only.

## 4. Wireframe look

Think default HTML with a little discipline.

- **Type:** system fonts only. Headings and body in `system-ui`. Times, amounts and references in `ui-monospace`. No Google Fonts.
- **Shapes:** square corners, 2px solid borders, no shadows, no gradients, no textures.
- **Structure:** each section is a bordered box with a small caption on its top edge, like a `<fieldset>`. Lists are plain tables with ruled rows. Dividers are `<hr>`.
- **Controls:** buttons are bordered boxes, primary ones filled with the viewer's colour. Inputs are plain bordered fields. Links are underlined.
- **Status:** plain text tags in square brackets, `[TBC]`, `[CONFIRMED]`, `[DUE 5 OCT]`, `[OVERDUE]`, `[OVER BUDGET]`. Overdue and over-budget also go bold. No coloured chips.
- **Confirmed stamp:** dropped. The `[CONFIRMED]` tag plus the confirmer's seal replaces it.
- **Icons:** none. Tabs are text: `NOW | LEDGER | INTEL`. Row actions are words: `edit`, `map`, `call`, `copy`.
- **Seals:** square-edged boxes with two letters, filled in the person's colour when ticked or voted, outlined otherwise.
- **Dark mode:** simple inversion (black background, white lines). Same colours for green, blue and yellow, lightened a step if needed for contrast.

### Sketch: NOW (pre-trip)

```
+--------------------------------------+
| BBC26                  PRE-TRIP   [SF]|   <- bar filled with viewer colour
+--------------------------------------+
| COUNTDOWN                            |
| 4d 20h 12m   to Wed 7 Oct 07:00      |
+--------------------------------------+
| NEEDS ATTENTION                      |
| [OVERDUE] Boat departure   by 5 Oct  |
| [DUE]     Checkout time    by 7 Oct  |
+--------------------------------------+
| OPEN VOTES                           |
| Day 3 lunch on the way home?         |
|  ( ) Udang Galah Lubuk Hantu   SF    |
|  ( ) Somewhere else                  |
|  ( ) Skip and push on                |
+--------------------------------------+
| [ Full itinerary ]                   |
+--------------------------------------+
| NOW | LEDGER | INTEL                 |   <- active tab filled
+--------------------------------------+
```

## 5. Size and data budget

- No images. The banner photo and its roughly 100 KB data URI are removed.
- No external requests at all (no fonts, no CDNs).
- No inline SVG textures or icon sets.
- Page file target: under 40 KB, down from about 170 KB.
- No change to the db subscriptions or document count.
- Implementation is a restyle of the existing file (CSS rewrite, remove banner, icons and textures, swap chips for text tags), not a rewrite. This also keeps the build cheap.

## 6. Screen changes

- **NOW:** same content per phase, boxed. Header bar replaces the band. Day 2 keeps big monospace time and boat readout, no special treatment otherwise.
- **LEDGER:** tiles become a 2x2 table. Budget lines become a ruled table. Spends and settle-up become tables.
- **KIT:** removed from the tab bar (see open questions).
- **INTEL:** each card is a bordered box: label, big value, status tag, optional needed-by, actions as words.
- **Sheets:** square bordered panel, same fields.
- **Gate ("Which one are you?"):** three square boxes with a coloured outline each, so choosing a person also chooses the colour.

## 7. Acceptance criteria

1. Soff sees green, Arif sees blue, Shereef sees yellow, on every screen, in light and dark.
2. Seals show the same fixed colour per person for every viewer.
3. Before binding, the UI is grey. After binding, it switches without a reload.
4. No request leaves the page except the Claude runtime. No images, no fonts.
5. Page file under 40 KB.
6. Looks right at 375px wide, nothing under the notch or home indicator, text readable on all three colours (yellow with black text).
7. Existing data, sync, offline bar, change dots, phase logic and writes all behave as before.

## 8. Open questions

1. **Colour mapping:** is SF green, AR blue, SH yellow right?
2. **KIT tab:** drop it (3 tabs) or keep it as an empty list you can fill? Recommendation: drop it, since the packing items were not relevant. The code and any data stay recoverable.
3. **Attention strip:** keep the three-item cap with "+n more"? Recommendation: keep.
