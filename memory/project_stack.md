---
name: project_stack
description: CSS/styling stack — Tailwind v4 replaced styled-components; ui/ component conventions
metadata:
  type: project
---

styled-components has been fully removed. Tailwind CSS v4 (`@tailwindcss/postcss`) is now the standard. `clsx` is available at `@/lib/cn`.

**Why:** styled-components was ugly, verbose, and used CSS-in-JS patterns that are hard to read. Tailwind is much cleaner for this project.

**How to apply:**
- All new UI components should use Tailwind utility classes + `cn()` from `@/lib/cn`
- `Button`, `Alert`, `Loader`, `Toast`, `TextField`, `CheckboxField` are all Tailwind-based with clean prop names (no `$` prefix)
- `Flex` and `View` from `@/components/ui` are kept as inline-style wrappers (same `$direction`/`$gap` API) for backwards compat — callers can be gradually migrated to `<div className="flex ...">` Tailwind divs
- CSS variables are defined in `src/app/globals.css` (previously in `GlobalStyles.tsx` / `ThemeProvider`)
- No more `ThemeProvider` or `GlobalStyles` imports needed in layouts
- Typography components (`Heading`, `H1`-`H5`, `Paragraph`) are now plain React FCs with `className` support
- `layout.tsx` and `typography.tsx` extensions (not `.ts`) because they contain JSX
