# Requirements

## 1. Overview

Crowd Bloom is a social collection toy where every player with an Aigram avatar can plant their face as a glowing petal, and all recent players together form one shared kinetic flower.

## 2. Visual Design

- Viewport is a fixed 390 x 680 portrait stage, scaled proportionally to fit the device and clipped with a 24px radius.
- Background uses a flat midnight ink field `#09070b` with a ceremonial radial wash `rgba(245,177,199,0.10)` behind the artifact, 28 dust motes sized 1-3px, and 0.5px cream hairline rules.
- The shared flower sits centered at x=195, y=310. It reads as a pressed-flower altar: a 78px moon-glass core, three petal rings, and thin cream orbit rules.
- Petal ring 1 uses radius 78px and 10 slots, ring 2 uses radius 116px and 16 slots, ring 3 uses radius 152px and 24 slots. Up to 50 newest petals are visible.
- Each petal is a 54 x 66px rounded oval with 999px radius, a 2px white translucent border, `0 0 22px` glow, and the player avatar cropped as a 42px circle in the center.
- Petal colors rotate through `#ff6fb1`, `#75e6ff`, `#f7d65c`, `#a8ff7a`, `#b991ff`, and `#ff9d6c`.
- Current player's newest petal gets an 86px pulsing halo, 1.8s loop, opacity 0.25-0.78.
- Header text uses a restrained editorial system: italic serif title 34px/400, utility captions 8.5px/700 uppercase with 0.38em letter spacing, and no dashboard-style cards.
- The primary action is a bottom ritual press button 338px wide, 58px tall, 999px radius, cream fill `#f4e8d0`, dark text `#09070b`, and a 0.5px pink edge glow.
- The avatar-missing prompt is a centered ritual notice 314px wide, no nested cards, with a 62px empty avatar seal, italic serif title 25px/400, and a single cream primary button.
- Asset list: Aigram watermark SVG at bottom-right 62px wide; no external art assets are required because avatars come from `head_url`.
- Non-Aigram browser preview defaults to a review page with four static stage previews: ready with avatar, missing avatar, planted feedback, and community bloom. `?play=1` bypasses the review page.

## 3. Game Mechanics

- On load, fetch the current user's Aigram profile; `head_url` determines whether planting is enabled.
- Load the current user's save archive named `petals`, seeded once into local mirror state. Each saved player keeps up to 12 own petals.
- Fetch the community bloom from platform save data by flattening every user's `petals` archive from the latest six save rows, sorting by `createdAt` descending, then displaying the latest 50 entries.
- Merge the local user's mirror petals optimistically into the community bloom and dedupe by `petal.id`.
- Planting creates one petal with:
  - `id`: `petal-${Date.now()}-${random 5 chars}`
  - `createdAt`: current epoch milliseconds
  - `angle`: `(createdAt / 137) % 360`
  - `ring`: `(visibleOwnPetalCount % 3) + 1`
  - `colorIndex`: `(visibleCommunityCount + visibleOwnPetalCount) % 6`
  - `pulse`: random value 0-999 for animation offset
- The flower animates at 60fps through CSS transforms only: whole bloom rotates 0.6deg every second, each petal bobs 5px over a 2.8-4.1s loop.
- Player can plant at most 1 petal every 45 seconds in the active session. Cooldown is shown as a numeric countdown on the main button.
- If no community data is available, show 18 demo ghost petals with initials only; these demo petals are not saved and are replaced once data loads.
- Outside Aigram, default URL renders the review page so the game can be judged without platform user data. Aigram iframe URLs with `api_origin` and `telegram_id` render the real game.
- Sound effects use Web Audio only: profile loaded chime 480Hz to 720Hz for 0.08s, plant chord 392/523/659Hz for 0.18s, missing-avatar soft buzz 160Hz to 120Hz for 0.12s, button click 620Hz to 420Hz for 0.04s.

## 4. Controls

- Main action button uses `onPointerDown`. If the user has `head_url`, it plants a petal; if not, it opens the avatar-missing sheet.
- Avatar-generation CTA uses `onPointerDown` and calls Aigram system function `AW.PROFILE.EDIT`; off-platform it stays visible but disabled.
- Each visible avatar petal uses `onClick`, not `onPointerDown`. Tapping another user's petal opens their Aigram profile; self petals are not profile buttons.
- Keyboard support: pressing `Space` or `Enter` while the stage is focused triggers the same plant-or-prompt action.
- Touch action for the full game surface is `manipulation`; the bottom strip scrolls vertically and must not be blocked by pointerdown handlers.

## 5. Win / Lose Conditions

- There is no failure state. The success state is planting a new petal and immediately seeing it join the shared flower.
- The result layer after planting shows `Bloomed`, the total visible petals count, the user's own saved petal count, and a 3-second floating `+1 petal` label.
- If the player lacks an avatar, the blocked state explains that their generated avatar is the game piece and offers `Generate avatar`.
- The game has three mutually exclusive screen modes: ready, planted feedback, and avatar-missing prompt.

## 6. Sound Effects

- `playClick`: button and sheet actions, triangle oscillator 620Hz down to 420Hz, 0.04s, gain 0.045.
- `playPlant`: successful plant, three sine oscillators 392Hz, 523Hz, and 659Hz, 0.18s, staggered by 0.025s, gain 0.065.
- `playMissing`: no-avatar prompt, sawtooth oscillator 160Hz down to 120Hz, 0.12s, gain 0.035.
- `playOpen`: community profile or avatar editor open, sine oscillator 480Hz to 720Hz, 0.08s, gain 0.04.
- Audio context resumes on the first pointer interaction only; all sound calls fail silently if Web Audio is unavailable.
