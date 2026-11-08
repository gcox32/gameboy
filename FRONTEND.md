# Frontend

Design principles for the app's UI. These are still being worked out, so expect this to grow.

## Hardware

Oak's Lab is built as physical machines: monitors, decks, a console, a platform. They follow one rule:

**The hardware is fixed and dumb; only the screens and lights know anything.**

Controls take input, screens and lamps give output, and the two never swap roles.

### Controls are physical

Buttons, keys, switches, rockers, dials and keypads are always there, always the same size and label, and always respond to a press, even if the press does nothing.

- No control renders conditionally or remounts when the mode or state changes. A control with nothing to do stays where it is.
- No control looks disabled. An unavailable one still presses and simply does nothing. Use `press()` from `src/components/oaks-lab/stage/press.ts`, which also tells screen readers it's unavailable.
- A control's label is printed on it. It never changes text (no "Connecting...", "Connected!", "Try Again") and never changes width.

### Only you move them

A switch goes wherever you put it and stays there.

- Nothing moves a switch for you. Changing mode doesn't reset or "helpfully" reposition one.
- No switch refuses a position. `SlideSwitch` has no way to lock a stop.
- A switch in a "bad" position gives the bad result: static on the monitor, or a screen explaining why nothing can happen there (e.g. "The party is full").

### Screens and lamps report everything

Progress, success, errors, and why something won't work all show on a screen or a lamp, never on a control.

- Lamps (`.lamp`, `.lamp_on`, `.lamp_off` in `lab.module.css`) are the small round lights for state: off, on, blinking while something is in progress, red on a fault.
- A screen keeps its size while its content changes. Reserve space for messages that may appear, rather than letting the machine grow.

### Screens are output only

Screens have no buttons, links that act as buttons, or other controls.

- When a screen needs an action, it asks for a hardware press instead: "Press any button to connect". Set `onAnyButton` on the `MonitorScreen` and all of the monitor's buttons do that one thing.

### Hardware outside the Lab page

Hardware that renders outside the Lab page still uses the Lab's materials. Add the `hardware` class from `lab.module.css` to get the colour tokens. The connect monitor (`save/ConnectModal.tsx`) is an example: a small monitor that drops in on cables rather than a generic dialog.

## Flicker

**Electricity switches; machinery moves.**

Anything electrical (lights, lamps, screens and what's on them) changes in hard steps. It cuts on, cuts off, blinks or stutters, and never fades or eases. Anything mechanical (decks sliding in, a switch's thumb, the connect monitor dropping on its cables, a key pressing down) moves with easing.

- **Striking.** A light coming on stutters before it holds, like a lamp warming up: `lightStrike` in `lab.module.css`. The platform's beam and pad glow both strike together.
- **Cutting off.** A light going off goes instantly. No fade-out transitions on lights.
- **Blinking.** On and off with `steps()`, never a pulsing fade: `.blink`, the "Press any button" prompt, an active lamp, a cursor.
- **Static.** A screen never crossfades between pictures. When its signal changes (a mode change, the input switch moving) or isn't ready yet, it cuts to snow and cuts back once the new picture is there.
- **Tuning in.** Something appearing on the platform flickers in, overexposed to solid in hard steps (`materialize`).
- **Screen contents snap.** A cursor, a highlighted tile or a lit page marker moves or changes with no transition.
- **Steady glow.** A light that's fully on may breathe slowly (`beamPulse`, `glow`). That's the one place easing touches a light, because it's a steady state, not a change.

Under `prefers-reduced-motion`, flicker and blinking stop and lights simply show their final state.

## Visual direction

- Each element follows its own in-world reference (see `refs/`), not one shared look.
- Prefer soft cream paper and Lab casing to dark modal chrome for new surfaces.
- A design inspiration isn't product language. If a panel is styled like a trainer card, the copy still doesn't say "trainer card". Keep existing labels when restyling.
