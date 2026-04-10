# Creature Asset Creation Patterns

## Project Structure

Creature assets are located in: `D:/workplace/gameDemo/ripper-project/src/assets/creature/{CREATURE_NAME}/`

### Required Files

1. **{CREATURE_NAME}.json** - Core creature data
   - NOT `creature.json` - filename matches creature name
   - Example: `CYCLOPS.json`, `DEATH_KNIGHT.json`, `Succubus.json`

2. **data-des.txt** - Constraint specification (Chinese format, D&D 4E style)
   - Contains original stat block in specific format
   - Used as source of truth for generating JSON

3. **anim/character.json** - Animation metadata
   - Sprite frame dimensions (frameWidth, frameHeight)
   - Anchor point for positioning (x, y)
   - Animation sequences with frame indices and FPS

4. **anim/standard/{action}.json** - Individual animation configs
   - idle.json, walk.json, slash.json, hurt.json
   - Contains frame-by-frame timing in milliseconds

5. **sprite.png** - Spritesheet (USER MUST PROVIDE)

## Data Constraint Schema Patterns

### Format Structure
```
{Creature Name}                                     LV{Level} {Role}
{Size} {Origin} {Type}                                XP{Value}
"HP{Total};重伤 {Half}"
AC{AC} 强韧 {Fort} 反射 {Ref} 意志 {Will}
速度 {Speed}[, 飞行 {Fly}]                  先攻+{Init}  侦查+{Percept}  {Senses}
抗性：{Value} {Type}
```

### JSON Field Mappings

**Core Identity**:
- `name`: Chinese name from constraint
- `nameEn`: English translation
- `level`: Number after "LV"
- `role`: Controller/Soldier/Brute/Skirmisher/Lurker/Artillery
- `xp`: Number after "XP"
- `size`: Small/Medium/Large/Huge/Gargantuan (小/中/大/超大/巨型)
- `type`: Humanoid/Beast/Undead etc.
- `origin`: Elemental/Natural/Shadow/etc. (星界/自然界/阴影界)

**Combat Stats**:
- `hp`: Total HP
- `bloodied`: Half of HP
- `ac`, `fortitude`, `reflex`, `will`: Direct from AC line
- `speed`, `fly`: Movement values
- `initiative`: Value after "先攻+"
- `senses`: After "侦查+" (e.g., "黑暗视觉")

**Resistances**:
```json
"resistances": [
  {
    "type": "火焰",
    "value": 10
  }
]
```

**Abilities**: Format is "Value (+Modifier)"
- STR, DEX, CON, INT, WIS, CHA
- Both value and modifier stored separately

**Powers Structure**:
```json
{
  "name": "基本近战：武器名",
  "displayName": "Display Name",
  "useType": "atwill|encounter|daily|recharge",
  "actionType": "standard|minor|move|free|opportunity|immediate",
  "range": "近战 1|射程 5|近程爆发 2",
  "target": "一个生物|范围内所有敌人",
  "description": "Full attack description with \n line breaks",
  "damage": "3d6+6|null",
  "attackBonus": "+14 vs. AC|+12 vs. 意志",
  "missEffect": null|"Miss effect text"
}
```

**Power Types** (from constraints):
- 标准动作: actionType: "standard"
- 次要动作: actionType: "minor"
- 触发动作: actionType: "immediate" or "opportunity"

**Power Usage**:
- 随意: useType: "atwill"
- 遭遇: useType: "encounter"
- 充能 5,6: useType: "recharge", recharge: [5, 6]

## Animation Configuration

### Frame Sizes by Creature Size
- Small: 32x32 or 48x48
- Medium (中型): 64x64 (most common)
- Large (大型): 96x96 or 128x128
- Huge (超大): 128x128 or 192x192
- Gargantuan (巨型): 192x192 or 256x256

### Anchor Points
- Center the sprite horizontally: frameWidth / 2
- Position near bottom: frameHeight - 8 to 16 pixels from bottom
- Example for 64x64: (32, 56)

### Frame Rate Standards
- Idle: 6 FPS (relaxed)
- Walk: 8 FPS (steady movement)
- Run: 10 FPS (faster movement)
- Attack: 12 FPS (quick, impactful)
- Hurt: 8 FPS (reaction)
- Death: 6 FPS (slow, dramatic)

### Millisecond Durations
- 6 FPS = ~166ms per frame
- 8 FPS = ~125ms per frame
- 10 FPS = ~100ms per frame
- 12 FPS = ~83ms per frame

## D&D 4E Stat Patterns by Level

### Level 9 (Controller) - Succubus Example
- HP: ~90
- AC: 23, Will: 23 (high for controller)
- At-will powers with control effects (charm, dominate)
- Minor action shapeshift
- Immediate interrupt defensive power

### Level 14 (Brute) - Cyclops Example
- HP: ~171 (higher due to brute role)
- High Fortitude (27)
- Recharge power (5,6) for area damage
- Simple melee at-will
- Passive trait (true seeing)

### Level 17 (Elite Soldier) - Death Knight Example
- HP: ~324 (elite = 2x HP)
- All defenses 27-33
- Multiple powers including encounter and recharge
- Aura ability
- Action point (elite feature)
- Opportunity attack power

## Common Issues & Solutions

1. **Filename Mismatch**: Creature JSON must be named `{CreatureName}.json`, NOT `creature.json`
2. **Missing Frames**: If sprite has fewer frames, adjust frame indices in character.json
3. **Power Effects**: Must include full description with line breaks (\n) for multi-line effects
4. **Charm/Control Powers**: Set damage to null if power doesn't deal damage
5. **Fly Speed**: Store as separate "fly" field, not in speed string

## Language Notes

- All display fields use Chinese (name, displayName, description)
- English name stored in "nameEn" field
- Attack bonuses use Chinese: "vs.AC" not "vs. AC"
- Defense names: AC, 强韧, 反射, 意志

## Validation Checklist

When creating creature assets:

1. ✅ Read data-des.txt constraint file
2. ✅ Map all stats to JSON fields correctly
3. ✅ Verify HP, bloodied (half HP) match
4. ✅ Check all defense values
5. ✅ Include all powers from each action type section
6. ✅ Verify ability scores and modifiers
7. ✅ Add resistances/immunities if present
8. ✅ Create anim folder structure
9. ✅ Generate character.json with correct frame size
10. ✅ Create standard action JSON files
11. ✅ Document what assets user needs to provide (sprite.png)
