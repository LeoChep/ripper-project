# DEATH_KNIGHT Creature Asset Folder

## Overview
Death Knight (死亡骑士) - Level 17 Elite Soldier undead creature based on D&D 4th Edition rules.

## File Structure
```
DEATH_KNIGHT/
├── DEATH_KNIGHT.json          # Main creature data (stats, powers, traits)
├── data-des.txt               # Data constraint specification
├── anim/
│   └── character.json         # Animation metadata and frame sequences
├── AVATAR_PLACEHOLDER.txt     # Sprite sheet placeholder (REPLACE WITH sprite.png)
└── README.md                  # This file
```

## Creature Statistics
- **Level**: 17 Elite Soldier (精英 护卫)
- **XP**: 3200
- **Size**: Medium (中型)
- **Type**: Natural humanoid (undead) - 自然界 类人生物（不死生物）
- **HP**: 324 (Bloodied: 162)
- **Defenses**: AC 33, Fortitude 31, Reflex 27, Will 29
- **Speed**: 5 squares
- **Initiative**: +11
- **Senses**: Darkvision (黑暗视觉)

### Abilities
- STR 20 (+13)
- DEX 12 (+19)
- CON 18 (+12)
- INT 13 (+9)
- WIS 11 (+8)
- CHA 14 (+10)

### Defenses
- **Immunities**: Disease, Poison (疾病, 毒素)
- **Resist**: 10 Necrotic (10 黯蚀)
- **Vulnerable**: 10 Radiant (10 光耀)
- **Save Bonus**: +2

### Equipment
- Plate armor (板甲)
- Heavy shield (重盾)
- Soul blade (灵魂之刃)

## Powers & Abilities

### Traits (特性)
1. **Aura: Command Undead** (灵气：统帅亡灵)
   - Aura 10: Undead allies of level 17 or lower gain +2 power bonus to attack rolls

2. **Radiant Vulnerability** (光耀易伤)
   - Vulnerable 10 radiant, +2 saving throws

3. **Action Point** (行动点)
   - 1 action point per encounter

### Standard Actions (标准动作)
1. **Melee Basic: Soul Blade** (基本近战：灵魂之刃)
   - At-will, Melee 1, +22 vs AC, 3d8+12 necrotic damage
   - Effect: Marks target until end of death knight's next turn

2. **Melee: Combat Challenge** (控位打击)
   - At-will, Melee 1, 1-2 creatures, +22 vs AC
   - Hit: 3d8+12 necrotic damage, target slowed (save ends)
   - Effect: Marks target until end of death knight's next turn

3. **Ranged: Hellfire** (邪炎)
   - Recharge 5,6, Area burst 2 within 10, living creatures
   - +20 vs Reflex, 6d8+12 fire and necrotic damage
   - Effect: Undead allies deal +2d6 fire damage on melee attacks until end of death knight's next turn

4. **Melee: Warrior's Challenge** (勇士挑战)
   - Encounter, Melee 1, 1-2 creatures, +22 vs AC
   - Hit: 4d8+19 necrotic damage, push target 2 squares
   - Effect: Marks all enemies within 2 squares of target

### Triggered Actions (触发动作)
1. **Combat Challenge** (战斗挑战)
   - Opportunity action: Triggered when adjacent marked enemy shifts or makes attack that doesn't include you
   - Make soul blade attack against triggering enemy

2. **Fury** (愤怒)
   - Immediate interrupt: Triggered when death knight is marked, slowed, immobilized, stunned, or dazed
   - Make saving throw to end triggering effect (even if effect normally doesn't allow save)

## Animation Configuration

The `anim/character.json` file defines the following animations:
- **idle**: Standing/ready pose (6 frames @ 6fps)
- **walk**: Normal movement (8 frames @ 8fps)
- **run**: Fast movement (8 frames @ 10fps)
- **attack**: Weapon attack (5 frames @ 12fps)
- **hurt**: Taking damage (3 frames @ 8fps)
- **death**: Death animation (6 frames @ 6fps)

### Frame Specifications
- Frame size: 128x128 pixels
- Anchor point: (64, 104) - bottom-center of sprite
- Total frames: 36 frames minimum required

## TODO
- [ ] Create actual sprite.png asset (replace AVATAR_PLACEHOLDER.txt)
- [ ] Update animation frame sequences in anim/character.json to match actual sprite sheet
- [ ] Adjust anchor point if sprite center of mass differs
- [ ] Add attack sound effects references if needed
- [ ] Test in-game for proper animation timing

## Implementation Notes
- Death Knight is a challenging Elite Soldier with marking capabilities
- Designed to lead undead minions with its aura
- High defenses and HP make it a formidable frontline combatant
- Multiple attack options provide tactical versatility
- Immediate interrupt ability makes it dangerous to debuff

## References
- D&D 4th Edition Monster Manual 3
- Data constraint specification: data-des.txt
