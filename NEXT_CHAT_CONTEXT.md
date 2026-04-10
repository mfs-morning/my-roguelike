# Next Chat Context — my_roguelike

## Goal of this note
This file is a handoff summary for the next chat.
Use it as the primary context source before making new changes.
The project is in a **mid-transition** state: several systems were upgraded recently and some assumptions changed.

---

## Current project direction
Game is a lightweight roguelike with:
- map progression
- auto battle based on skill priority
- reward view after battle
- runtime skill modification system
- status effect system (minimal usable version)
- UI for managing active/standby skills in a modal

Design direction so far:
- current skills are effectively **warrior** skills
- full class system is **not implemented yet**
- but class placeholders have been added

---

## Important architecture decisions already made

### 1. Skills are NOT copied per run as full instances
Current design is:
- static skill definitions in `src/core/skills.ts`
- per-run overrides in `battleSkillRuntimeState`
- effective values computed through `src/core/effectiveSkills.ts`

Reason:
- easier than full per-run skill instances
- enough for cooldown reduction / damage increase / extra effects
- can evolve later if true skill instances become necessary

### 2. Status system exists and is isolated
Status logic was intentionally split into a dedicated file:
- `src/core/statusEffects.ts`

This file currently handles:
- applying skill extra effects
- resolving DOT at turn start
- duration decay

Current statuses:
- `poison`
- `bleed`

Current rule:
- both are DOT
- both currently behave the same mechanically
- only names/logs differ for now

### 3. Battle flow assumption
The battle engine currently follows this general order:
1. hero start-of-turn status resolves
2. if hero survives, hero acts
3. hit damage is applied
4. skill extra effects are applied
5. enemy start-of-turn status resolves
6. if enemy survives, enemy retaliates

Important note:
- hero acts first
- if enemy dies before retaliation, enemy does not attack

---

## Files that matter most

### Types
- `src/types/index.ts`

### Core systems
- `src/core/skills.ts`
- `src/core/effectiveSkills.ts`
- `src/core/skillTemplates.ts`
- `src/core/statusEffects.ts`
- `src/core/engine.ts`
- `src/core/battlePriority.ts`
- `src/core/constants.ts`

### Store
- `src/store/useGameStore.ts`

### Skill UI
- `src/components/BattlePriorityList.tsx`
- `src/components/BattleSkillCard.tsx`
- `src/components/SkillManagerButton.tsx`
- `src/components/SkillManagerModal.tsx`
- `src/components/StatsCard.tsx`

### Battle / reward views
- `src/views/BattleView.tsx`
- `src/views/RewardView.tsx`

---

## Systems currently implemented

### Skill runtime state
Types added in `src/types/index.ts`:
- `BattleSkillModifier`
- `BattleSkillRuntimeState`

Store field in `src/store/useGameStore.ts`:
- `battleSkillRuntimeState`

Store action already exists:
- `upgradeBattleSkill(skillId, modifier)`

This is the intended way to do run-time skill upgrades.
Example supported upgrades:
- cooldown reduction
- bonus damage
- damage multiplier bonus
- block gain bonus
- extra effects

### Effective skill resolver
File:
- `src/core/effectiveSkills.ts`

Purpose:
- merges static definition + runtime modifier
- should be used anywhere that needs current actual skill values

### Status effects
Types currently present:
- `BattleStatusEffectKind`
- `BattleStatusEffect`
- `BattleSkillExtraEffect`

Characters and enemies now have:
- `statusEffects: BattleStatusEffect[]`

Current status file:
- `src/core/statusEffects.ts`

Current exported functions there:
- `applySkillStatusEffects(...)`
- `resolveStartOfTurnStatusEffects(...)`

### New skill added
File:
- `src/core/skills.ts`

New skill:
- `rend`
- label: `撕裂`
- applies `bleed`

Current default priority is:
- `['heavyStrike', 'rend', 'guard', 'attack']`

### Battle UI improvements already added
- `BattleView` now shows current status badges for hero and enemy
- `BattleSkillCard` hover description includes extra effect text
- `SkillManagerModal` card body includes extra effect text

---

## Class placeholders already added
This was intentionally added as a future-proof placeholder, not a full class system.

In `src/types/index.ts` there should now be:
- `CharacterClassId = 'warrior' | 'rogue' | 'mage'`
- `BattleSkillTag = CharacterClassId | 'bleed' | 'poison' | 'block' | 'strike'`

`Character` should now contain:
- `classId: CharacterClassId`

`BattleSkillDefinition` should now contain:
- `classId: CharacterClassId`
- `tags: BattleSkillTag[]`

Current intended default:
- hero is `warrior`
- all current skills are `warrior`

Current skill tagging plan:
- `attack`: `['warrior', 'strike']`
- `heavyStrike`: `['warrior', 'strike']`
- `rend`: `['warrior', 'strike', 'bleed']`
- `guard`: `['warrior', 'block']`

---

## IMPORTANT: recent state and possible inconsistency warning
During the last chat, work was interrupted by concurrency errors more than once.
Some files were updated successfully, but because of interruption the next assistant should **verify current file contents before building on them**.

Especially verify these files before further edits:
- `src/types/index.ts`
- `src/core/skills.ts`
- `src/core/constants.ts`
- `src/core/engine.ts`
- `src/core/statusEffects.ts`
- `src/store/useGameStore.ts`
- `src/views/BattleView.tsx`
- `src/components/BattleSkillCard.tsx`
- `src/components/SkillManagerModal.tsx`

Do not assume the handoff is perfectly synchronized with the filesystem without reading the files first.

---

## What was just requested before context ran out
User asked:
- because context is almost full, write an md for the next chat
- user wants the note in the clearest format for continuing work

So this file is that handoff.

---

## Recommended next-step priorities
Pick based on user request.

### Safe next tasks
1. verify current state after the interrupted edits
2. expose class/tag info in UI where useful
3. add reward choices for skill upgrades
4. make poison and bleed behave differently
5. add a second class prototype (likely rogue)

### Suggested order if no new direction is given
1. verify class placeholder integration is complete
2. show skill tags/class in debug or management UI
3. add class-aware filtering for future reward generation
4. only then consider a fuller class system

---

## Important gameplay notes to preserve
- battle log order was changed earlier so newest logs show at top
- battle log persists through `RewardView`
- battle log hides when returning to `MapView`
- skill manager modal exists and original priority list remains outside modal
- left list in modal supports reorder drag
- left/right drag toggles active vs standby skills
- at least one active skill must remain

---

## If implementing future class system
Recommended path (already discussed with user):
- do NOT build full class system yet unless at least 2 distinct gameplay loops exist
- current project should stay in a “warrior-first” phase
- class placeholders were added only to reduce future refactor cost

Suggested eventual direction:
- warrior = block / strike / stable frontliner
- rogue = bleed / poison / burst / multi-hit
- mage = burn / weaken / charge / spell effects

---

## Reminder for next assistant
- keep changes focused
- keep using comments on core functions when editing logic
- read files before editing
- avoid over-engineering
- if touching battle logic, verify engine + store + UI together

