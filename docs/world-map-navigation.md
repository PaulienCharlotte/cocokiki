# World Map Navigation

The homepage uses one 1672 x 940 image at
`public/dreamworld/world-map-modern.webp`. It was encoded from the supplied
original at WebP quality 94, without resizing or separating the islands.

`WORLD_DESTINATIONS` in `platform/dreamworld.ts` owns the normalized centres
and hit areas of the six illustrated buttons. The briefing lists the home
destination twice; both home functions belong to the same treehouse.

| Destination | Existing Route |
| --- | --- |
| Cooking | `/treehouse/cookbook` |
| Treehouse | `/treehouse` |
| Mathematics | `/islands/math` |
| Plants | `/plantendokter` |
| Geography and clocks | `/islands/discovery` |
| Language placeholder | `/islands/language` |

The treehouse toolbar links to `/shop/furniture`. The shared navigation keeps
all stores and the encyclopedia available; the mobile menu also links directly
to the cookbook. Existing aliases, activities, game logic and storage keys are
unchanged.

`WorldMapViewer` reuses the existing cover sizing and bounded viewport helpers.
Image and transparent buttons share a single transform. Minimum zoom fits the
entire image inside the viewport; maximum zoom is 2.5 times the initial crop,
with wheel zoom anchored at the pointer and pinch zoom anchored between the
two contacts. Dragging suppresses accidental navigation. Keyboard focus brings
off-screen destinations into view. Reset restores the initial centred crop.
Reduced-motion preferences disable transform transitions.

Views are remembered in memory, not in saved game data. The stable image URL
allows normal browser image caching. If loading fails, an accessible list of
the same destinations remains available.

Verified at 375, 768 and 1440 CSS pixels: six routes, wheel and native touch
pinch gestures, mobile menu, touch navigation while zoomed, furniture access,
unchanged local storage and balance, and failed-image fallback. Unit tests also
cover normalized destinations and viewport limits.
