# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ripper Project is a web-based tactical RPG (SRPG) game inspired by D&D 4th Edition rules. Built with Vue 3, TypeScript, and PixiJS as the graphics engine.

**Maintainer**: LEO-CHEP
**License**: Free for commercial and non-commercial derivative use with attribution

## Common Commands

```bash
# Development
npm run dev              # Start dev server (default: http://localhost:5173)
npm run build            # Build for production (includes type-check)
npm run build-only       # Build without type checking
npm run preview          # Preview production build
npm run type-check       # Run TypeScript type checking
npm run test             # Run Vitest tests
```

## Architecture Overview

### Tech Stack
- **Vue 3** (Composition API) - UI framework
- **TypeScript** - Core game logic
- **Pinia** - State management
- **PixiJS** - 2D WebGL rendering engine
- **Vite** - Build tool
- **Vue Router** - Navigation

### Directory Structure

```
src/
├── assets/              # Game assets (sprites, maps, powers, effects)
├── class/               # Base class definitions (Unit.ts)
├── components/          # Vue components (GamePannel, ActionPannel, etc.)
├── core/                # Core game logic
│   ├── action/         # Movement, attack actions
│   ├── ai/             # Enemy AI
│   ├── anim/           # Animation system
│   ├── buff/           # Buff/debuff system
│   ├── controller/     # Combat/out-of-combat controllers
│   ├── power/          # Skills/powers
│   ├── system/         # Game systems (Initiative, Attack, Damage, etc.)
│   ├── trait/          # Character traits
│   ├── units/          # Unit classes (Creature, Weapon, Door)
│   ├── MapClass.ts     # Map system (Tiled .tmj format)
│   └── DiceTryer.ts    # Dice rolling system
├── drama/              # Story/scripts
├── stores/             # Pinia stores
├── views/              # Vue views (HomeView, AboutView)
├── router/             # Vue Router config
└── utils/              # Utility functions
```

## Core Game Systems

### ECS-Style Architecture
- **Entity**: `Unit` - game units with unique UUID
- **Component**: `Creature`, `Weapon`, `Trait`, `Buff` - modular attributes
- **System**: `InitiativeSystem`, `AttackSystem`, `BuffSystem`, etc. - game logic

### Key Systems

1. **InitiativeSystem** (`src/core/system/InitiativeSystem.ts`)
   - Manages turn order using D&D 4E rules
   - `InitiativeSheet[]` - global turn queue
   - Tracks round count, combat state, party ownership

2. **UnitSystem** (`src/core/system/UnitSystem.ts`)
   - Manages all game units
   - Handles unit creation, death, cleanup
   - Stores `Creature` data with stats, abilities, powers

3. **MapClass** (`src/core/MapClass.ts`)
   - Tiled map (.tmj) parsing and rendering
   - Layer system: tiles, objects, collision
   - Door system, boundary detection
   - Fog of war (see `fog_modules/`)

4. **Combat Controllers**
   - `CharacterCombatController`: In-combat player control (movement, attack ranges, skill selection)
   - `CharacterOutCombatController`: Exploration mode (free movement, dialogue trigger)

5. **DramaSystem** (`src/core/system/DramaSystem.ts`, `src/drama/`)
   - Dialogue system with `unitSpeak()`, `unitChoose()`
   - Event triggering based on variables/flags
   - Story progress saved to localStorage

### Data Structures

**Creature** - Contains all unit data:
- Stats: HP, AC, Fortitude, Reflex, Will, Speed
- Abilities: STR, DEX, CON, INT, WIS, CHA
- Powers, traits, buffs, resistances
- Size, type, role

**Power** - Skills/abilities:
- Type: at-will, encounter, daily
- Action: standard, move, minor, free
- Range, area, target defense
- Hit/miss effects, keywords

**Buff** - Status effects with lifecycle hooks:
- `onApply`, `onRemove`, `onTurnStart`, `onTurnEnd`
- Duration tracking
- Modifier application

## D&D 4E Rules Implementation

- **Attack Roll**: `1d20 + attack modifier >= target defense`
- **Damage**: Dice roll with modifiers
- **Actions**: Standard (attack/spell), Move, Minor, Free, Opportunity, Immediate
- **Defenses**: AC, Fortitude, Reflex, Will
- **Movement**: Normal movement, Shift (1 square, no opportunity attack), Charge (+1 to hit)
- **Critical Hit**: Natural 20 always hits

## Resource Management

### Sprite Assets (`src/assets/creature/`)
- `sprite.png` - Spritesheet
- `meta.json` - Animation metadata (frame positions, duration)
- `action.json` - Action configuration (walk, attack, idle, etc.)

### Map Assets (`src/assets/map/`)
- Created with Tiled Map Editor
- Export as `.tmj` (JSON) format
- Support multiple tile layers and object layers

### Effect Assets (`src/assets/effect/`)
- Skill effect animations
- APNG or frame sequences
- Extractor tool available: `extractor.html`

## Development Notes

### Adding New Creatures
1. Create folder in `src/assets/creature/`
2. Prepare spritesheet and animation metadata
3. Create Creature config in code

### Adding New Powers
1. Create JSON in `src/assets/powers/`
2. Implement power class in `src/core/power/`

### Creating Drama/Story
1. Create file in `src/drama/`
2. Extend `Drama` class
3. Use `CGstart()`, `unitSpeak()`, `unitChoose()`, `CGEnd()` methods

### Asset Path Alias
- `@` maps to `src/` directory
- Import assets: `@/assets/...`

## Vue Router Structure

- `/` - HomeView (main game interface)
- `/about` - AboutView

## Pinia Stores

- `characterStore` - Character state
- `initiativeStore` - Initiative/turn state
- `message.ts` - Message/notification state
- `talkStateStore` - Dialogue state

## Testing

- Vitest for unit tests
- Example test: `src/core/testDiceTryer.test.ts`
- Run single test: `npm run test -- <test-file>`

## Asset Generation Tools

- `generate-anim-json.js` - Generate animation JSON
- `rearrange-frames.py` - Rearrange sprite frames
- `check-size.js` - Check asset sizes

## Performance Notes

- Shadows disabled for performance (see git commit history)
- Use sprite atlases for animations
- Fog of war system for visibility calculation

## Important Files

- `src/core/MapClass.ts` - Map parsing and collision
- `src/core/system/InitiativeSystem.ts` - Turn management
- `src/core/controller/CharacterCombatController.ts` - Combat player control
- `src/views/HomeView.vue` - Main game interface
- `src/stores/initiativeStore.ts` - Turn state for UI
