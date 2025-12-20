## project description

Meal Planner is a Next.js-based meal planning and tracking application designed for parents to plan and monitor daily meals for young children, with a focus on balanced nutrition and child-friendly, Montessori-inspired participation. The primary user is the caregiver, while children interact through simple, visual “build your plate” flows rather than data-heavy tracking or calorie counts.

The app supports multiple children (e.g., “Presley” and “Evy”) with child-specific meal plans and histories, including breakfast, lunch, dinner, and snacks across the week. Foods are organized into intuitive categories (Proteins, Grains, Fruits, Vegetables, Milk, Ranch, Condiments, Other), allowing parents to assemble meals that align with common pediatric meal patterns and balanced plates rather than strict dieting. Parents can optionally view detailed nutrition (calories, protein, carbs, fat) for each meal and day, while the default views emphasize food groups, variety, and patterns instead of numbers.

Meal Planner offers daily, weekly, and historical views per child, showing planned meals and what was actually eaten, so caregivers can see trends in preferences, exposure to different foods, and overall balance over time. The app includes real-time nutritional calculations from a shared food database, serving-size adjustment, and a milk-inclusion toggle for quickly managing dairy in meals. Over time, advanced features such as barcode scanning, recipe-based meal creation, and AI-powered food analysis (plate photos, QR codes) will make logging and planning faster while still keeping the core UX simple for busy parents.

Technically, Meal Planner is built with Next.js 15.1.4, MongoDB for persistent storage, and Zustand (with Immer) for intuitive, immutable state management on the client. The UI uses Radix UI primitives styled with Tailwind CSS and custom components following shadcn/ui patterns, with Jest and React Testing Library providing test coverage for core flows. The architecture is designed to support iterative expansion: starting with manual meal planning and basic analytics, and later layering on computer vision, barcode scanning, and richer recipe management as the product matures.

## V1 scope

**In scope for v1 (must-have):**

- Core entities and data model:
  - Children (profile with name, age, optional avatar/color).
  - Foods (name, category, base serving, optional nutrition facts).
  - Meals (meal type + foods + serving sizes + flags like “includes milk”).
  - Meal plans (per child, per day, per meal).
- Parent-facing planning UI:
  - Weekly grid for each child (rows = days, columns = meal types).
  - Quick “add/edit meal” drawer/modal with category-based food pickers.
  - Ability to clone meals across days or between children.
- History and consumption tracking:
  - Mark a planned meal as “offered,” “eaten,” or “partially eaten,” with a simple note field.
  - Historical view (at least last 2–4 weeks) showing what was actually eaten vs. planned.
- Nutrition logic (parent-focused):
  - Per-meal and per-day food-group totals (e.g., servings of fruit/veg, grains, proteins, milk).
  - Optional numeric macros (calories, protein, carbs, fat) visible in a parent-only panel or toggle.
- Simple child interaction:
  - A very lightweight child-facing screen where a child taps icons to confirm what they ate (e.g., “I ate my chicken,” “I ate my apples”), without showing numbers or calories.
- Auth & basic multi-user support:
  - Single-family account with simple email/password login (no multi-tenant complexity beyond that).

**Out of scope for v1 (later phases):**

- AI/vision: plate photo recognition, QR/label parsing.
- Barcode scanning and auto-import of nutrition facts.
- Full recipe system (ingredients, instructions, generated nutrition from ingredients).
- Grocery list generation.
- Social/sharing features, notifications, and reminders.

## Key screens and flows

- **Parent dashboard (Home):**
  - Overview of the week for all children, quick links into each child’s weekly planner, and a “today at a glance” strip with meals and simple food-group indicators.
- **Child weekly planner:**
  - Per-child grid (7 days × meal types) with inline meal previews and quick actions (edit, clone, mark as eaten).
- **Meal editor:**
  - Select foods by category, adjust serving sizes, toggle milk, and see a compact nutrition/food-group summary update in real time.
- **Child “What I ate” screen:**
  - Simple, large-tap UI for each meal with food icons and states like “ate / some / none,” designed for a 5–7-year-old to use with minimal guidance.
- **History & insights:**
  - List or calendar view of past days per child, with filters like “show only vegetables” or “where fruit was missing,” plus minimal charts (e.g., how many days this week included a vegetable at dinner).

## Technical shape of v1

- **Backend/API:** Next.js route handlers for CRUD on children, foods, meals, and plans; MongoDB collections for each core entity; server-side validation and basic access control.
- **State management:** Zustand slices for: current family/children, weekly plans (per child), editing state for a single meal, and transient UI state (modals, toasts).
- **Testing:** Jest + React Testing Library covering: meal creation/editing, weekly planner interactions, basic nutrition calculations, and the child “ate it / didn’t eat it” flow.

If you’d like, the next step could be a concrete data schema (Mongo collections + TypeScript types) and a minimal routing/layout plan for the Next.js app.

[1](https://miriammatas.com/portfolio/case-study-cutiepie/)
[2](https://nricha.github.io/projects/munchkin/)
[3](http://shunendo.weebly.com/meal-app-project-ux.html)
[4](https://topflightapps.com/ideas/how-to-build-a-pediatrics-on-demand-app/)
[5](https://www.littlelunches.com/en)
[6](https://incode-systems.com/projects/mobile-application-on-flutter-case-study)
[7](https://www.theseus.fi/bitstream/10024/745426/2/Thesis_Creating_a_meal_planning_mobile_application_using_Lean_startup_approach.pdf)
