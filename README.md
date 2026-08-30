# Build Track Dashboard

Build a modern, visually striking web application called “BuildTrack”, a Construction Budget & Variance Tracking dashboard. Complete the full requested scope in this single build phase, using realistic mock data only. Use React with Tailwind CSS, Framer Motion for rich transitions/micro-interactions, and Recharts for premium animated charts. No backend is required because mock data is requested.

Core model: projects have unlimited user-named phases. Each phase contains Original Plan, Revisions (reason + timestamp), auto-computed Current Plan, and Actuals, each split into Materials, Labor, and Tasks. Variance must be shown at line item, phase, and project levels.

Visual direction: premium modern SaaS like Linear/Vercel/Notion with a construction-industrial edge, not generic Bootstrap. Dark by default in deep charcoal/navy with amber/burnt-orange warmth; include a working light/dark toggle. Use distinctive non-system typography, bold geometric headings and readable body text. Glassmorphism/layered depth, carefully restrained shadows, soft glows. Add card hover lift/glow and subtle mouse-move 3D tilt for prominent cards. Use smooth number counter animations, eased progress fills, premium animated visualizations, and a 3D-feeling animated phase completion ring/gauge. Provide a tasteful isometric building/crane empty-state illustration where useful. Skeleton loading states rather than blank flashes.

Build these screens and make navigation fully usable:
1. Dashboard/Home: portfolio of active-project cards. Each shows planned vs actual health, mini status ring, budget/variance data, and “at risk” badge when relevant. Top bar includes search, alerts access, theme toggle, and a + New Project button. Ensure project navigation works.
2. Project detail: project heading, overall variance percentage, animated horizontal phase timeline where phase segments can be clicked to expand/select. Below, phase cards/list grid showing planned vs actual across materials, labor and tasks, variance %, status. Selecting phase should feel like a smooth shared-element-style transition, not a hard reload.
3. Phase detail: tabs Materials/Labor/Tasks. Table for each with item name, planned quantity/cost, actual quantity/cost, variance; use clear inline color coding. Working Log Actual button that opens a polished modal form and updates mock UI state. A Revisions panel/timeline shows planning changes with timestamp and reason.
4. Analysis/Insights: Recharts visuals for cost composition materials/labor/other, phase planned-vs-actual comparison sorted by variance %, ranked “Top Contributors to Overrun”, and cross-project insight such as plumbing over budget in 3 of last 4 projects.
5. Alerts: a slideout and/or dedicated usable view listing active alerts, severity color, project/phase, and short explanation. Alerts control should work.

Use multiple realistic mock construction projects, each with multiple phases such as Foundation, Framing, Plumbing, Electrical, plus user-defined examples. Make buttons and core interactions feel responsive, and build clean reusable modular components. Ensure the final app is coherent, desktop-first and responsive, production-quality in visual polish.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fa74714e-a170-4b84-be31-451a85661b05).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
