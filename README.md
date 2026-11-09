# ExactSpoti

A music player built to try [Exact](https://github.com/expo/exact), Expo's cross-platform
framework. One codebase for web, iOS and macOS, with Android pending. The audio is the free
[SoundHelix](https://www.soundhelix.com/audio-examples) demo songs; artists, albums and covers
are generated.

## Run it

Needs Bun 1.4.2, Rust 1.97 with the Apple targets, Xcode and Chrome.

```sh
# Exact lives next to this repo, pinned to the last commit that builds with Xcode 27.0.
git clone https://github.com/expo/exact ../exact
git -C ../exact checkout 4756891
bun ../exact/scripts/exact.mjs setup

bun exact.mjs web        # browser
bun exact.mjs ios --run  # iOS Simulator
EXACT_IDENTITY=- bun exact.mjs mac --run  # macOS, signed ad hoc
bun exact.mjs test       # tests; `test ios` for the Simulator
```

## Where things are

| Path | What it holds |
|---|---|
| `app.contract` | Routes, the player engine, the single root `audio` element, screen layout |
| `components/`, `screens/` | Track rows, cards, the player bar, Now Playing |
| `shapes.contract` | Records shared by every screen |
| `app.ts`, `data/` | The data module: a generated 5,000-song catalog, search, seeded shuffle |
| `app.tamber` | Colours and icons |
| `tools/make-covers.ts` | Generates the bundled cover art |

Desktop shortcuts: `k` play/pause, `Shift+←` previous, `Shift+→` next.

## Status

| Platform | State |
|---|---|
| Web | All tests pass |
| iOS Simulator | All tests pass |
| macOS | Builds and launches when signed ad hoc; Exact's test driver cannot connect, so it is untested |
| Android | Not built: needs a Hermes runtime built from `expo/ibex`, and the host has no audio player yet |

## Notes from trying Exact

- A native route draws above anything outside it, so the player bar lives inside each route.
- A horizontal `list` needs an explicit `overflow-x`, or dragging it scrolls the page.
- Handler props take no arguments, so list loops bind theirs where the loop is written.
- `Space` cannot be declared in `aria-keyshortcuts`, which is why play/pause is `k`.
- Exact's `verify` found real bugs here: the shelf scrolling above and undersized tap targets.
