# INVEQ Design Language

> Principle: **care through consistency**, not spectacle.  
> Prefer deleting a useless animation over adding a pretty one.  
> Every pixel should feel intentional.

Companion document (product constitution): [`PRODUCT_LANGUAGE.md`](./PRODUCT_LANGUAGE.md).

This document is the human contract for **visual grammar**. The source of truth in code lives in:

| Language | Module |
|----------|--------|
| Motion | `src/constants/theme/motion.ts` |
| Surface | `src/constants/theme/surfaces.ts` |
| Typography | `src/constants/theme/type-roles.ts` |
| Interaction | `src/constants/theme/interaction.ts` |
| Components | `src/constants/theme/components.ts` |
| Hub | `src/constants/theme/design-system.ts` |

---

## 1. Motion Language

| Token | Value | Use |
|-------|-------|-----|
| `duration.instant` | 100ms | Press release, micro feedback |
| `duration.fast` | 160ms | Focus, color, tab switch, list item |
| `duration.normal` | 240ms | Default transition, push, card enter |
| `duration.slow` | 360ms | Sheet settle, deliberate entrance |
| `duration.deliberate` | 480ms | Brand / splash only |
| `duration.max` | 560ms | Hard ceiling |

**Springs**

| Token | Feel | Use |
|-------|------|-----|
| `spring.snappy` | Tight | Press, toast, chrome |
| `spring.soft` | Natural | Cards, sheet open |
| `spring.gentle` | Slow settle | Large panels only |

**Rules**

- List stagger ≤ **32ms**, max **8** items staggered.
- Overlay: open `normal` / soft spring · close `fast` / snappy.
- Navigation push `normal`, pop `fast`.
- Opacity/color → easing curves. Interactive UI → springs.
- No animation without a communication purpose.

---

## 2. Surface Language

**Elevation ladder only:** `0` flat · `1` card · `2` raised · `3` floating · `4` sheet.

**Family rule:** Dashboard card = Client card = Invoice/Quote card =  
`surface.card` + `elevation[1]` + `radius.card` (16).

| Role | Background | Elevation | Radius |
|------|------------|-----------|--------|
| canvas | `background` | 0 | 0 |
| grouped | `backgroundGrouped` | 0 | 0 |
| **card** | `surface` | **1** | **card** |
| cardRaised | `surface` | 2 | card |
| inset | `surface` | 0 | lg |
| sheet | `surfaceElevated` | 4 | sheet |
| overlay | scrim 40% | 0 | 0 |

Borders: hairline allowed on cards; do not stack heavy border + heavy shadow.

Blur (`material.*`): nav / sheets on iOS only; opaque fallback elsewhere.

---

## 3. Typography Language

| Role | Token | Role |
|------|-------|------|
| Hero | `type.hero` | Max **1** per screen |
| Section | `type.section` | Screen / block title |
| Card title | `type.cardTitle` | Name / number line |
| Primary number | `type.primaryNumber` | Money, KPIs |
| Secondary | `type.secondary` | Supporting sentence |
| Caption | `type.caption` | Dates, meta |
| Badge | `type.badge` | Status pills |
| Micro | `type.micro` | Fine print |
| Body | `type.body` | Paragraphs |
| Label | `type.label` | Form labels |

**Card scan order:** primaryNumber / cardTitle → secondary → badge → caption → micro.

---

## 4. Component Language

Official catalog (see `componentLanguage`):  
Button · Card · Input · Badge · Dialog · Bottom Sheet · Toast · Dropdown · FAB · Search · Empty State · Loading · Skeleton.

Shared contracts:

- Same radii from `radius.*`
- Same press recipes from `press.*`
- Same elevation ladder
- Inputs are **contained** (no bare underline-only fields in product UI)
- Loading prefers **skeleton** over spinner when layout is known

---

## 5. Interaction Language

| Target | Scale | Haptic | Notes |
|--------|-------|--------|-------|
| Card | **0.985** | selection | Spring snappy; elevation 1→0 while pressed |
| Button | **0.98** | impactLight | Elastic return |
| Chrome | 0.96 + opacity | selection | Icon buttons |
| Row | opacity / highlight | selection | Grouped lists |

**Success:** toast + success haptic + icon · auto-dismiss **2800ms**  
**Error:** toast + error haptic + icon · auto-dismiss **4200ms**

Use `triggerHaptic(intent)` from `@/lib/haptics`.

---

## 6. Application order (after Phase 0 + Product Language)

Apply only under [`PRODUCT_LANGUAGE.md`](./PRODUCT_LANGUAGE.md) principles:

1. Dashboard  
2. Document cards  
3. Clients  
4. Forms  
5. Navigation  
6. Settings  

New features inherit this language by composing tokens — they do not redesign from scratch.

Every PR must pass the **Feature Quality Checklist** in Product Language §5.

---

## 7. Definition of done for any UI PR

- [ ] Uses `type.*` / `surface.*` / `duration|spring` / `press.*` — no magic numbers for motion or elevation  
- [ ] Press recipe applied on every new tappable  
- [ ] No orphan animation  
- [ ] Cards in the shared family (`surface.card`)  
- [ ] Feels calm and intentional on first open
