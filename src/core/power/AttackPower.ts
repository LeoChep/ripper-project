import { Power } from './Power';
import type { Unit } from '../units/Unit';
import type { TiledMap } from '../MapClass';
import type { CreatureAttack } from '../units/Creature';

/**
 * 攻击型技能类，继承自Power，专门处理攻击相关的逻辑
 */
export class AttackPower extends Power {
  
  /**
   * 将Power转换为CreatureAttack格式，用于兼容现有的攻击系统
   */
  toCreatureAttack(caster: Unit): CreatureAttack {
    // 计算攻击加值（这里简化处理，实际应该根据公式计算）
    const abilityModifier = this.getAbilityModifier(caster, this.getPrimaryAbility());
    const levelBonus = Math.floor(this.level / 2);
    const attackBonus = abilityModifier + levelBonus;

    return {
      name: this.name,
      type: this.weaponType === 'melee' ? 'Melee' : 'Ranged',
      action: this.getActionDescription(),
      range: this.range,
      attackBonus: attackBonus,
      target: this.getTargetDefense(),
      damage: this.getDamageDescription(caster),
      effect: this.system.hit.detail || undefined,
      missEffect: this.system.miss.detail || undefined
    };
  }

  /**
   * 获取能力值调整值
   */
  private getAbilityModifier(unit: Unit, ability: string): number {
    if (!unit.creature?.abilities) return 0;
    
    const abilityMap: Record<string, string> = {
      'str': 'Strength',
      'dex': 'Dexterity', 
      'con': 'Constitution',
      'int': 'Intelligence',
      'wis': 'Wisdom',
      'cha': 'Charisma'
    };

    const abilityName = abilityMap[ability.toLowerCase()];
    const abilityData = unit.creature.abilities.find(a => a.name === abilityName);
    return abilityData?.modifier || 0;
  }

  /**
   * 获取动作描述
   */
  private getActionDescription(): string {
    const useType = this.isAtWill ? '随意' : this.isEncounter ? '遭遇' : this.isDaily ? '每日' : '';
    const action = this.actionType === 'standard' ? '标准动作' : 
                  this.actionType === 'move' ? '移动动作' : 
                  this.actionType === 'minor' ? '次要动作' : this.actionType;
    
    return `${action}; ${useType}`;
  }

  /**
   * 获取伤害描述
   */
  private getDamageDescription(caster: Unit): string {
    const baseDesc = this.system.hit.detail || '';
    
    // 如果有武器伤害，需要替换[W]
    if (baseDesc.includes('[W]')) {
      // 这里简化处理，实际应该根据装备的武器计算
      const weaponDamage = '1d8'; // 默认武器伤害
      return baseDesc.replace(/\[W\]/g, weaponDamage);
    }
    
    return baseDesc;
  }

  /**
   * 检查是否可以攻击指定目标
   */
  canAttackTarget(caster: Unit, target: Unit, map: TiledMap): boolean {
    if (!this.canUse(caster)) return false;
    
    // 检查距离
    const distance = this.calculateDistance(caster, target);
    if (distance > this.range) return false;
    
    // 检查视线（如果是远程攻击）
    if (this.weaponType === 'ranged' || this.system.rangeType === 'range') {
      return this.hasLineOfSight(caster, target, map);
    }
    
    return true;
  }

  /**
   * 计算两个单位之间的距离
   */
  private calculateDistance(unit1: Unit, unit2: Unit): number {
    const dx = Math.abs(Math.floor(unit1.x / 64) - Math.floor(unit2.x / 64));
    const dy = Math.abs(Math.floor(unit1.y / 64) - Math.floor(unit2.y / 64));
    return Math.max(dx, dy); // 使用棋盘距离
  }

  /**
   * 检查视线
   */
  private hasLineOfSight(caster: Unit, target: Unit, map: TiledMap): boolean {
    // 这里简化处理，实际应该检查路径上是否有障碍物
    // 可以使用射线投射算法
    return true;
  }

  /**
   * 获取攻击范围内的所有目标
   */
  getTargetsInRange(caster: Unit, map: TiledMap): Unit[] {
    if (!map.sprites) return [];
    
    return map.sprites.filter(target => {
      if (target === caster) return false;
      if (target.party === caster.party) return false; // 不攻击同伴
      return this.canAttackTarget(caster, target, map);
    });
  }

  /**
   * 获取可攻击的格子坐标
   */
  getAttackablePositions(caster: Unit, map: TiledMap): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    const casterX = Math.floor(caster.x / 64);
    const casterY = Math.floor(caster.y / 64);
    
    // 根据攻击范围计算可攻击的格子
    for (let dx = -this.range; dx <= this.range; dx++) {
      for (let dy = -this.range; dy <= this.range; dy++) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (distance > 0 && distance <= this.range) {
          const x = casterX + dx;
          const y = casterY + dy;
          
          // 检查该位置是否在地图范围内
          if (this.isValidPosition(x, y, map)) {
            positions.push({x, y});
          }
        }
      }
    }
    
    return positions;
  }

  /**
   * 检查位置是否有效
   */
  private isValidPosition(x: number, y: number, map: TiledMap): boolean {
    // 检查是否在地图边界内
    if (x < 0 || y < 0) return false;
    
    // 这里可以添加更多的位置有效性检查
    // 比如检查是否有墙壁等障碍物
    
    return true;
  }

  /**
   * 执行攻击
   */
  async executeAttack(caster: Unit, targetX: number, targetY: number, map: TiledMap): Promise<void> {
    // 转换为CreatureAttack格式并调用现有的攻击系统
    const attack = this.toCreatureAttack(caster);
    
    // 导入攻击模块（避免循环依赖）
    const { attackMovement } = await import('../action/UnitAttack');
    
    // 消耗行动点数
    this.consumeActionPoints(caster);
    
    // 执行攻击
    await attackMovement(targetX, targetY, caster, attack, map);
  }
}
