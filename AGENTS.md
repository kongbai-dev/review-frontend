## Frontend skill: Vue 3 + Tailwind CSS

### Tech stack
- Use Vue 3 with Composition API and `<script setup>`.
- Use TypeScript for all new components and composables.
- Use Vite-compatible project structure.
- Use Tailwind CSS for styling first; avoid custom CSS unless necessary.
- Prefer existing shared UI components before creating new ones.

### Component rules
- Keep components focused and single-purpose.
- Define `props`, `emits`, and slots explicitly.
- Do not place heavy business logic directly in templates.
- Move reusable logic into composables.
- Prefer computed state over duplicated reactive state.

### Styling rules
- Use Tailwind utility classes directly in templates.
- Keep class lists readable and grouped by layout, spacing, typography, color, state.
- Reuse repeated visual patterns through shared wrapper components or utility functions.
- Do not introduce arbitrary pixel values unless existing spacing scale cannot satisfy the design.
- Preserve responsive behavior for mobile, tablet, and desktop.

### UI/UX rules
- Every interactive element must have hover, focus, disabled, and loading states when applicable.
- Every page-level async request must define loading, empty, error, and success states.
- Forms must have validation feedback and accessible labels.
- Tables and dense admin pages should prioritize information density and clarity over decoration.

### Accessibility
- Use semantic HTML first.
- Ensure keyboard accessibility for dialogs, dropdowns, tabs, and menus.
- Preserve visible focus styles.
- Add aria labels where text is insufficient.

### Code organization
- Shared UI: `src/components`
- Page components: `src/pages`
- Reusable logic: `src/composables`
- Utilities: `src/lib`
- Types: `src/types`

### When generating code
- First check whether an existing component can be extended.
- When editing UI, do not break existing business logic.
- Output complete code, not pseudo-code.
- Briefly explain major structural changes after code edits.

### Admin/dashboard page preferences
- Keep filters, stats, and actions compact.
- For data-heavy pages, prioritize table visibility.
- Prefer sticky headers and scrollable content regions when the page is dense.
- Avoid oversized hero sections on internal tools.

### Design consistency
- Use consistent radius, spacing, and shadow scale across components.
- Avoid mixing too many visual styles in the same page.
- Prefer neutral backgrounds with clear emphasis on actionable areas.

### Refactor discipline
- Do not rename public props/events/routes unless necessary.
- Do not change API contracts unless explicitly requested.
- Preserve existing behavior while improving structure and UI.