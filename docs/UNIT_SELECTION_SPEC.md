# Interactive Building & Unit Selection — Specification & Gap Analysis

> Scope: the public drill‑down journey **Master Plan → Building → Floor → Unit → Apartment Layout**, plus the admin content workflow that feeds it.
> This document is grounded in the **current REDP codebase**, not a greenfield design. Every "exists" claim references real code; every "gap" is something genuinely missing today.

---

## 0. Current Implementation Status (baseline)

| Capability | Status | Where |
|---|---|---|
| Project selector | ✅ Built | `web/src/pages/public/InteractiveUnitSelection.tsx` `renderProjectSelector` |
| Master plan view + zoom lightbox + clickable building pins | ✅ Built | `renderBuildingSelector`, `showMasterPlanLightbox` |
| Building cards with building image | ✅ Built | line ~1729 `building_images[building.name]` |
| Floor selector (3D stacked floors + floor‑plan preview on hover) | ✅ Built | `renderFloorSelector` (~1887) |
| **Full floor plan shown on units step** | ✅ Built (Phase 1) | `renderUnitGrid` floor‑layout banner |
| **Clickable apartment hotspots over floor plan** | ✅ Built (Phase 2) | `renderUnitGrid` overlay; `floor_plan_hotspot` |
| Apartment layout image + areas in unit panel | ✅ Built | `renderUnitPanel` `layout_image_url` |
| Admin: upload building image / floor plan / unit layout | ✅ Built | `ProjectMediaController`, `AdminPanel.tsx` Media Gallery |
| Admin: place units on floor plan (hotspot editor) | ✅ Built (Phase 2) | `web/src/components/FloorHotspotEditor.tsx` |
| Demo schematic generator | ✅ Built | `php artisan demo:floorplans {projectId}` |
| Structural elements (elevators, shafts, corridors as data) | ❌ **Gap** | see §2.3 |
| Filtering within a floor/building (e.g. 2‑BR) | ❌ **Gap** | see §4.1 |
| Building‑name identity consistency (admin vs public) | ⚠️ **Risk** | see §2.5 |

---

## 1. User Journey Map

The public page is a 4‑step state machine: `type Step = 'projects' | 'buildings' | 'floors' | 'units'` driven by `currentStep`.

### Step 1 — Project / Master Plan
- **Data in:** `GET /public/projects` (list) → on select `GET /public/projects/{id}/units-by-building`, `/media`, `/3d-models`, `/interactive-map`.
- **UI shows:** project cards; after selection, the **master plan image** (SVG or raster) with clickable building **pins** (from `interactive-map` hotspots) and a **buildings directory**.
- **Interaction:** click a building pin or a building card → `handleSelectBuilding` → `currentStep='floors'`.
- **Back‑nav:** breadcrumb "Master Plan" resets to `projects`.

### Step 2 — Building → Floors
- **Data in:** the selected `BuildingData` (already loaded), `building_images[name]`, `building3DModels[name]`.
- **UI shows:** building image/3D, a **3D stacked‑floors tower**, and a **live floor‑plan preview** that swaps on hover (`hoveredFloor`).
- **Interaction:** click a floor with `available_units > 0` → `handleSelectFloor` → `currentStep='units'`. Floors with 0 available are dimmed and non‑clickable.
- **Back‑nav:** breadcrumb (project name) → `buildings`.

### Step 3 — Floor → Units (the core of this feature)
- **Data in:** `selectedFloor.units[]` (each with `status`, `area`, `bedrooms`, `price`, `layout_image_url`, `floor_plan_hotspot`), and `floor_plan_images["{building}|{floor}"]`.
- **UI shows:**
  1. **Full floor‑plan banner** (the "تقسيمة الدور كامل") with zoom.
  2. **Clickable apartment regions** overlaid at each unit's `floor_plan_hotspot`, tinted by status (green/amber/red/cyan/grey).
  3. A **fallback unit grid** below (cards) for units without a hotspot and as a list view.
- **Interaction:** click an **available** apartment region (or card) → `handleSelectUnit` → opens the side panel. Non‑available regions show a lock cursor and do nothing.
- **Back‑nav:** breadcrumb (building name) → `floors`.

### Step 4 — Unit Detail (side panel, not a full step)
- **UI shows:** apartment **layout image** (zoomable) **or** 3D model if present; area, type, view, floor, unit number, bedrooms/bathrooms, price; **Reserve** CTA → EOI flow.
- **Interaction:** Reserve → multi‑step EOI form (`/public/eoi/submit`).
- **Back‑nav:** close panel returns to the units step with floor plan intact.

**Navigation summary:** every level is reachable via the persistent breadcrumb (`renderBreadcrumbs`), so users can jump up any number of levels without losing project context.

---

## 2. Data & System Gaps

### 2.1 What must exist at each level

| Level | Required for flow to work | Source of truth |
|---|---|---|
| Project | `id`, `name`, `released_phases` (units only show if `phase ∈ released_phases`) | `projects` table |
| Building | a distinct `unit.building` **string** with ≥1 unit | derived from `units.building` |
| Building image | `project_media` row `media_type='building'`, `reference_key = building name` | admin upload |
| Floor | distinct `unit.floor` integer within a building | derived from `units.floor` |
| Floor plan | `project_media` row `media_type='floor_plan'`, `reference_key = "{building}|{floor}"` | admin upload / demo gen |
| Unit hotspot | `units.floor_plan_hotspot = {x,y,w,h}` (percent) | hotspot editor / demo gen |
| Apartment layout | `units.layout_image_url` (or a completed 3D model) | admin upload / demo gen |

### 2.2 Missing‑data behavior (already handled vs. to confirm)
- **No master plan:** building step shows a "No Master Plan Available" placeholder. ✅
- **No building image:** card falls back to a gradient accent bar + 3D tower. ✅
- **No floor plan image:** floor banner is **hidden** on the units step; preview panel on floors step shows "No floor plan uploaded". ✅ → *Decision:* is silently hiding acceptable, or should it show a placeholder so users know a plan is "coming soon"?
- **Floor plan exists but no hotspots:** banner shows the image with **no clickable regions**; users must use the card grid below. ✅ acceptable, but *not discoverable* — consider a hint badge "diagram not interactive yet".
- **No available units on a floor:** floor is dimmed/non‑clickable at the floors step. ✅
- **No units at all in building:** building won't appear (grouping is unit‑driven). ✅ but means an empty building is invisible even if it has an image.

### 2.3 Structural elements (elevators, shafts, corridors, front/back units) — **NEW REQUIREMENT, GAP**
Today a floor plan is a **single flat image**. Structural elements only exist if they are **drawn into that uploaded image**; the system has **no structured representation** of elevators, ventilation shafts, corridors, or unit orientation (front/back).

Three options to specify:
- **A — Image‑only (current):** elevators/shafts/corridors are part of the uploaded floor‑plan artwork. Zero new data. Cannot filter/label/relate them. *Lowest effort.*
- **B — Image + labeled non‑unit hotspots:** extend the hotspot model with a `kind` field (`unit | elevator | shaft | corridor | stairs`) so non‑unit regions can be labeled/tooltipped but aren't clickable‑to‑reserve. *Moderate effort, reuses the editor.*
- **C — Structured floor schema:** a real geometry model (polygons, orientation, adjacency). *High effort; only justified if you need analytics like "all north‑facing front units".*

Add **unit orientation** (`unit.orientation` already exists in the model but is unused in this flow) to satisfy "front and back units" — surface it in the unit panel and as a future filter.

> **Recommendation:** Option **B**. It directly answers the user's stated need (show elevators/shafts/corridors), is incremental on the editor already built, and keeps reservation logic clean (only `kind='unit'` is reservable).

### 2.4 Metadata required to make the flow *useful* (not just functional)
- Per unit (mostly present): `area`, `net_area`, `bedrooms`, `bathrooms`, `view_type`, `orientation`, `price`, `status`, `type`.
- Per floor (missing as first‑class data): a human floor label (e.g. "Ground", "Mezzanine", "Roof") — currently only an integer.
- Per building (missing): building description, total floors confirmed vs. derived, amenities on that building.

### 2.5 Identity‑consistency risk (the silent failure mode) ⚠️
- The **admin Media Gallery** lists buildings/floors from the `Building` / `BuildingFloor` tables (`GET /admin/projects/{id}/buildings`) and keys uploads by `Building.name` and `BuildingFloor.floor_number`.
- The **public page** groups by the **`units.building` string column** and `units.floor` integer.
- If `Building.name !== units.building` (or floor numbers differ), images upload "successfully" but **never appear publicly** — no error is shown.
- **Mitigations to decide:** (a) enforce that `units.building` is always set from `Building.name` at unit‑creation time; (b) add a validation/health check in the Media Gallery that flags buildings/floors with no matching units; (c) make the public grouping join on `building_id` instead of the free‑text column.

---

## 3. Content Management Workflow

### 3.1 Admin: how images get in (current)
Entry point: Admin → Projects → **Project Media Gallery Manager** (`openProjectMediaModal`).
1. **Master plan:** `POST /admin/projects/{id}/master-plan-image` (raster) or `/master-plan-svg` (vector, enables polygon building hotspots).
2. **Project cover + gallery:** cover card imagery for the public home.
3. **Building image:** per building → `POST /admin/projects/{id}/building-image` (`building_name`, `image`).
4. **Floor plan:** per building+floor → `POST /admin/projects/{id}/floor-plan-image` (`building_name`, `floor_number`, `image`).
5. **Apartment layout:** per unit → `POST /admin/units/{unitId}/image`.
6. **Place units on plan (Phase 2):** "Place Units on Plan" button → `FloorHotspotEditor` → click to position each unit → `POST /admin/units/{unitId}/floor-hotspot` `{x,y,w,h}`.

### 3.2 Recommended authoring order (publish to content managers)
1. Set up buildings & floors (units must exist and carry the correct `building`/`floor`).
2. Upload master plan (SVG preferred for clickable pins).
3. Upload each building image.
4. Upload each floor plan; immediately open **Place Units on Plan** and position the apartments (or **Auto‑arrange grid** then nudge).
5. Upload each apartment layout (or generate 3D).
6. **Verify publicly** at `/unit-selection?project={id}` — confirm images appear (catches the §2.5 name mismatch early).

### 3.3 Format guidance
- **Master plan:** SVG for crisp zoom + polygon hotspots; PNG/JPG acceptable (pins only).
- **Building image:** PNG/JPG render, transparent PNG looks best on cards.
- **Floor plan:** PNG/JPG or SVG. Aspect ratio is free, but **overlay alignment assumes the image fills the container width with natural height** (the public overlay uses percentage coordinates) — so the uploaded image's drawable area should match where hotspots are placed. The demo generator emits **SVG at 1000×680**.
- **Apartment layout:** PNG/JPG/SVG; shown ≤ ~360px tall, click‑to‑open full size.
- **Hotspots & areas:** structured **data** (`floor_plan_hotspot` JSON, `area`/`net_area` decimals), not baked into images.

### 3.4 Availability management
`units.status ∈ {available, reserved, sold, hidden, coming_soon, frozen}` drives color everywhere (plan overlay, cards, floor availability). Reserved/sold/etc. are **not clickable to reserve** publicly. Status is changed via admin unit management and automatically by the EOI/reservation pipeline.

---

## 4. Design & Implementation Decisions (open)

### 4.1 Filtering / search within a building or floor — **not built**
Recommended: a lightweight filter bar at the floors/units step (bedrooms, price range, view, orientation, status=available‑only). High user value; the unit fields already exist. *Decision: scope for Phase 3?*

### 4.2 Information per stage (to maximize decision‑making)
- Building step: total/available units, floor count, price range "from X".
- Floor step: available/total per floor (present), + price range per floor (missing).
- Unit step: full spec card (present) + financing/"from X EGP/month" hook (missing).

### 4.3 Large buildings (many floors/units)
- Floors step currently renders a stacked tower; for 20+ floors this needs scroll/virtualization or a compact list toggle. *Decision needed.*
- Units step: card grid auto‑wraps; for 50+ units add pagination or the floor‑plan view becomes primary (it scales better than cards).
- Floor‑plan overlay: fine for ~4–12 units/floor (demo proves it); very dense floors need zoom/pan on the plan itself (reuse the master‑plan lightbox pattern).

### 4.4 Back‑navigation (present, confirm sufficiency)
Breadcrumb jumps to any level; per‑step Back; panel close. *Confirm:* do we also want a browser‑history/URL state per step (deep‑linkable building/floor)? Today only `?project=` is deep‑linkable.

---

## 5. Role‑Specific Extracts

### 5.1 Developers
- **State machine:** `currentStep` over 4 steps; selection handlers `handleSelectProject/Building/Floor/Unit`.
- **Public endpoints:** `GET /public/projects`, `/projects/{id}/units-by-building`, `/projects/{id}/media`, `/projects/{id}/3d-models`, `/projects/{id}/interactive-map`.
- **Admin endpoints:** `building-image`, `floor-plan-image`, `units/{id}/image`, `units/{id}/floor-hotspot` (POST/DELETE), `setup-building`, `setup-units-for-floor`.
- **Key data shapes:** `building_images[name].image_url` (full URL); `floor_plan_images["{name}|{floor}"].image_url` (full URL); `unit.layout_image_url` (**relative path** — frontend prefixes `http://127.0.0.1:8000/storage/`); `unit.floor_plan_hotspot = {x,y,w,h}` percent.
- **Schema:** `units.floor_plan_hotspot` JSON (cast `array`); migration `2026_06_24_110000_add_floor_plan_hotspot_to_units`.
- **Known inconsistencies to resolve:** (a) unit image relative vs. media full URL; (b) public grouping by `units.building` string vs. admin `Building` table (§2.5); (c) base URL is hardcoded `127.0.0.1:8000` in several places — should use an env‑driven asset base.

### 5.2 UI/UX Designers
- Decision points: building pin vs. card; floor hover‑preview vs. click‑enter; plan‑overlay vs. card grid (currently both shown — decide primary).
- States to design: empty (no plan / no hotspots / no available units), loading, error, dense‑floor.
- Patterns to reuse: master‑plan **zoom/pan lightbox** for dense floor plans; status color legend (green/amber/red/cyan/grey).
- Open: should the floor‑plan overlay replace the card grid entirely once hotspots exist?

### 5.3 Product Managers — user stories / acceptance
- *As a buyer, I select a building and see its image and floors.* ✅
- *…enter a floor and see the full floor plan with units divided.* ✅ (structural labels = §2.3 decision).
- *…click an available apartment on the plan and see its internal layout + areas.* ✅
- *…cannot select sold/reserved units.* ✅
- *…filter to 2‑bedroom available units.* ❌ Phase 3.
- Acceptance for "floor plan with divisions": plan image renders; each unit region is positioned, status‑colored, and (if available) opens the unit; missing‑data states render gracefully.

### 5.4 Content / Admin Managers — how‑to
See §3.2 authoring order. Golden rules: (1) units must carry the **exact** building name + floor used when uploading; (2) after uploading a floor plan, **place the units** (Auto‑arrange then nudge); (3) always **verify on the public page**; (4) keep apartment layouts legible at small sizes.

---

## 6. Open Decisions Register

| # | Decision | Owner | Default if undecided |
|---|---|---|---|
| D1 | Structural elements: image‑only (A) / labeled hotspots (B) / structured schema (C) | PM + Dev | **B** (labeled hotspots) |
| D2 | Show placeholder vs. hide when floor plan missing | Design | Hide (current) |
| D3 | Make plan overlay the primary unit picker (drop/keep card grid) | Design + PM | Keep both |
| D4 | Add filtering (bedrooms/price/view/orientation) | PM | Defer to Phase 3 |
| D5 | Resolve building identity (string vs. `building_id` join) | Dev | Enforce `units.building = Building.name` |
| D6 | Deep‑link building/floor in URL | Dev | Defer |
| D7 | Large‑building handling (virtualize floors, paginate units) | Dev + Design | Defer until a real >15‑floor project |
| D8 | Env‑driven asset base URL (remove hardcoded host) | Dev | Fix before production |
| D9 | Surface `orientation` (front/back) in panel + filter | PM + Dev | Add to panel now, filter later |
