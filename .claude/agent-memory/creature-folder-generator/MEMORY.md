# Creature Asset Generation - Agent Memory

## Project Structure Patterns

### Creature Folder Organization
All creatures follow this structure:
```
src/assets/creature/{creature_name}/
├── {creature_name}.json          # Core creature data
├── avatar.png                    # UI portrait (optional)
├── README.md                     # Documentation (optional)
└── anim/
    ├── character.json            # Animation metadata
    ├── standard/                 # Base spritesheet
    ├── custom/                   # Custom animations
    └── credits/                  # Asset attribution
```

## Data Constraint Schema (creature.json)

### Required Fields
- `name` (string) - Chinese display name
- `level` (number) - Creature level (1-30)
- `role` (string) - Combat role in Chinese ("精英 野兽", "杂兵 游击", etc.)
- `xp` (number) - Experience point value
- `size` (string) - Size category ("中型", "大型", "超大型")
- `type` (string) - Creature type ("巨人", "自然界", etc.)
- `hp` (number) - Hit points
- `maxHp` (number) - Maximum HP (same as hp)
- `bloodied` (number) - Half of HP
- `ac`, `fortitude`, `reflex`, `will` (number) - Defenses
- `speed` (number) - Movement speed in squares

### Abilities Object Structure
```json
"abilities": {
  "STR": { "value": 26, "modifier": 8 },
  "DEX": { "value": 14, "modifier": 2 },
  "CON": { "value": 22, "modifier": 6 },
  "INT": { "value": 10, "modifier": 0 },
  "WIS": { "value": 16, "modifier": 3 },
  "CHA": { "value": 8, "modifier": -1 }
}
```

### Powers Array Structure
Each power must include:
- `name` (string) - Internal English identifier
- `displayName` (string) - Chinese display name
- `useType` (string) - "atwill", "encounter", "daily"
- `actionType` (string) - "standard", "move", "minor", "free"
- `range` (string) - Range in Chinese ("近战 2", "远程 10/20")
- `target` (string) - Target description in Chinese
- `description` (string) - Full description in Chinese
- `damage` (string or null) - Damage expression
- `attackBonus` (string or null) - Attack bonus in Chinese ("+17 vs. AC")
- `missEffect` (string or null) - Miss effect description

### Weapons Array Structure
```json
{
  "name": "长剑",
  "type": "Melee",
  "action": "武器",
  "range": 1,
  "proficiency": 3,
  "bonus": 1,
  "target": "ac",
  "weapon": "1d8",
  "damage": "1d8",
  "effect": "",
  "missEffect": null
}
```

## D&D 4E Level 10 Elite Monster Standards

### Expected Values for Level 10 Elite
- **HP**: ~248 (Elite = 2x standard monster HP)
- **AC**: ~28
- **Fortitude**: ~30 (higher for brutes)
- **Reflex**: ~24
- **Will**: ~22
- **Attack Bonus**: +17 to +19 vs appropriate defense
- **Damage**: 2d6+8 to 3d6+8 for at-will attacks
- **XP**: 500 (Elite = 2x standard of 250 XP)

### Role-Specific Patterns
- **Brute**: High HP (248), high Fortitude (30), 2d6+8 damage
- **Soldier**: High AC (30), marks and tanking abilities
- **Skirmisher**: High speed (8+), shift abilities
- **Artillery**: Ranged attacks, lower defenses
- **Controller**: Area attacks, debuffs, conditions

## Animation Configuration Patterns

### character.json Structure
- Uses LPC spritesheet system
- `bodyTypeName` for character base
- `layers` array for sprite composition
- `customAnimations` object for animation definitions

### Standard Animation Set
- **idle**: 6 frames @ 6 FPS, loop true
- **walk**: 8 frames @ 8 FPS, loop true
- **run**: 8 frames @ 10 FPS, loop true
- **attack**: 5 frames @ 12 FPS, loop false
- **hurt**: 3 frames @ 8 FPS, loop false
- **death**: 6 frames @ 6 FPS, loop false

### Frame Specifications
- **Frame Size**: 128x128 pixels (Medium/Large)
- **Anchor Point**: (64, 112) for bottom-center
- **Gargantuan Creatures**: Consider 256x256 frames
- **Layout**: Horizontal spritesheet, all frames in sequence

## Creature Size Categories

- **Small (小型)**: Smaller than Medium
- **Medium (中型)**: Standard human-sized (128x128 frames)
- **Large (大型)**: 2x2 squares (128x128 or 192x192 frames)
- **Huge (超大型)**: 3x3 squares (192x192 or 256x256 frames)
- **Gargantuan (巨型)**: 4x4+ squares (256x256+ frames)

## Language and Localization

### Chinese Display Names
- Use descriptive names: "独眼巨人" (Cyclops)
- Role format: "精英 野兽" (Elite Brute)
- Size format: "超大型" (Gargantuan/Large)
- Attack notation: "+17 vs. AC"
- Range format: "近战 2" (Melee 2), "远程 10/20" (Ranged 10/20)

## Common Issues and Solutions

### JSON Validation
- Always validate JSON after creation
- Check for missing quotes around property names
- Ensure all strings use double quotes
- Verify trailing commas are removed

### File Structure
- Create all directories before writing files
- Use absolute paths for all operations
- Follow naming conventions (lowercase folder names, uppercase for constants)

## Asset Generation Workflow

1. **Gather Requirements**
   - Creature name and concept
   - Level and role
   - Size and type
   - Core abilities and powers

2. **Create Folder Structure**
   - Main creature folder
   - anim subfolder with standard/custom/credits

3. **Generate Configuration Files**
   - creature.json with stats and powers
   - character.json with animation metadata
   - README files with documentation

4. **Validate and Test**
   - JSON validation
   - Structure verification
   - Integration readiness check

## Memory Update Date
2026-04-12 - Added BLACK_SWORDSMAN (Level 6 Elite Soldier)
2026-04-10 - Initial patterns documented from CYCLOPS creation
