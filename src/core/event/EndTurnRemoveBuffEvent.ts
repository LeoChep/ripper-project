import type { BuffInterface } from "../buff/BuffInterface";
import { BattleEvenetSystem } from "../system/BattleEventSystem";
import { BuffSystem } from "../system/BuffSystem";
import { ModifierSystem } from "../system/ModifierSystem";
import type { Unit } from "../units/Unit";

export class EndTurnRemoveBuffEvent {
  // 结束回合时移除增益效果事件
  static readonly type = "UnitEndTurnEvent";
  endTurnUnit: Unit; // 结束回合的单位
  buff: BuffInterface; // 要移除的增益效果
  turnCount: number; // 回合数
  constructor(endTurnUnit: Unit, buff: BuffInterface, turnCount: number) {
    this.endTurnUnit = endTurnUnit;
    this.buff = buff;
    this.turnCount = turnCount; // 记录回合数
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent({
      eventHandler: async (endturnUnit) => {
        // 处理结束回合时移除增益效果
        if (this.endTurnUnit !== endturnUnit) {
          return;
        }
        const targetUnit = this.buff.owner;
        if (!targetUnit) {
          console.warn(`Buff owner is not defined for buff: ${this.buff.name}`);
          return;
        }
        const buffs = targetUnit.creature?.buffs;
        if (!buffs) {
          console.warn(`No buffs found for unit: ${this.endTurnUnit.name}`);
          return;
        }
        const buffToRemove = buffs.find((buff) => buff == this.buff);
        console.log(
          `EndTurnRemoveBuffEvent: Removing buff ${this.buff.name} from unit ${this.endTurnUnit.name}, turn count: ${this.turnCount}`
        );
        console.log("EndTurnRemoveBuffEvent", buffToRemove);
        if (buffToRemove) {
          this.turnCount--;
          if (this.turnCount <= 0) {
            BuffSystem.getInstance().removeBuff(buffToRemove, targetUnit);
          }
        }
      },
      typeName: EndTurnRemoveBuffEvent.type,
    });
  };
}
