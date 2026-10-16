# Little Table design system

The moodboard informs warm linen surfaces, sage and eucalyptus greens, muted blue, clay accents, and a subtle gingham background. Serif display headings bring warmth; system sans-serif body text keeps forms and instructions readable without network font dependencies.

## Source of truth

- [Tailwind tokens and component styles](src/index.css): semantic colors, typography, 4px spacing scale, 24px card radius, soft card shadows, and 180ms transitions. Dark mode overrides semantic colors rather than individual components.
- [Shared UI](src/components/UI.tsx): Panel, PageHeading, and consistent 24px outline icons.
- [Application shell](src/components/AppShell.tsx): desktop navigation, mobile bottom navigation, skip link, and persistent theme preference.
- [Authentication](src/components/AuthScreen.tsx): shared login and signup layout.
- [Confirmation dialog](src/components/ConfirmDialog.tsx): native modal focus containment, Escape dismissal, and explicit destructive-action confirmation.

## Layout and interaction

Use one column on small screens and two or three columns for related cards at larger breakpoints. Keep primary actions at least 48px tall, supporting icon actions at least 44px, and readable inputs at 16px. Use semantic surface, ink, muted, line, and brand tokens; avoid page-specific literal colors. Recipe cards expand in place. Cooking instructions and ingredients become adjacent panels on desktop. Leave bottom padding for mobile navigation and device safe areas.

Use visible form labels, semantic headings, alert/status feedback, keyboard focus outlines, and reduced-motion support. Images must include useful alternative text or be explicitly decorative. Avoid invented recipe imagery or metadata when the catalog does not provide them.

## Validation

Build with `npm run build` from the application directory. Authenticated recipe data and AI flows require the existing Firebase session and backend configuration; do not substitute demo records into production routes.
