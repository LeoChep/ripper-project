import * as UnitMoveController from "../contoller/UnitMoveController";
import type { TiledMap } from "../MapClass";
import type { Unit } from "../Unit";
import type { AIInterface } from "../type/AIInterface";
import * as InitiativeController from "../contoller/InitiativeController";

export class NormalAI implements AIInterface {
  constructor() {
    // Initialization code for NormalAI
  }

  // Method to handle AI actions
   autoAction(unit: Unit, map: TiledMap) {
    //寻找目标
    // 这里可以实现AI的目标选择逻辑
    map.sprites.forEach(sprite => {
      if (sprite.party !== unit.party) {
        // 选择一个敌人作为目标
        // 这里可以实现更复杂的目标选择逻辑
        const moveAble=UnitMoveController.checkPassiable(unit, sprite.x, sprite.y,unit.x,unit.y,map);
        console.log(`AI ${unit.name} targets ${sprite.name}`);
      }
    });

    InitiativeController.endTurn(unit)
    // Implement the logic for the AI to automatically take actions
   }
}   