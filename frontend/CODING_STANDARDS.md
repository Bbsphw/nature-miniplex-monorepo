# Coding Standards

## 1. TypeScript Strictness
- **`any` is strictly prohibited.** Use specific types or `unknown`.
- All API responses and requests must be typed using interfaces defined in `src/types/api.ts`.
- Component props must be explicitly defined using interfaces (e.g., `interface ButtonProps { ... }`).

## 2. ESLint Rules
- No unused variables (`@typescript-eslint/no-unused-vars`).
- Strict dependency arrays in `useEffect` and `useCallback` (`react-hooks/exhaustive-deps`).
- Run `pnpm run lint` before committing any code.

## 3. Component Anatomy
- Define the component using `export function ComponentName() { ... }` (avoid default exports except for Next.js Pages/Layouts).
- Destructure props in the function signature.
- Use `cn()` utility (clsx + tailwind-merge) for dynamic class names.
- Keep components small. If a component exceeds 150-200 lines, extract smaller sub-components.

## 4. Environment Variables
- Prefix variables exposed to the browser with `NEXT_PUBLIC_`.
- Define variables in `.env` or `.env.local`.
- Example: `NEXT_PUBLIC_API_URL=https://localhost:7157`
