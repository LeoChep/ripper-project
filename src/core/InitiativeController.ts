import { diceRoll } from "./DiceTryer";
import { InitiativeClass } from "./InitativeClass";
import { Unit } from "./Unit";

const InitiativeSheet = [] as InitiativeClass[];
const initiativeCursor = { pointAt: null as null | InitiativeClass };
export async function addUnitsToInitiativeSheet(units: Unit[]) {
  const allAddedPromise = [] as Promise<any>[];
  units.forEach((unit) => {
    const promise = addToInitiativeSheet(unit);
    allAddedPromise.push(promise);
  });
  await Promise.all(allAddedPromise);
  return;
}

export async function addToInitiativeSheet(unit: Unit) {
  const creature = unit.creature;
  console.log("initiativeValueCreature", creature);
  const initiativeBonus = creature?.initiative;
  const initiativeValue = await diceRoll("1d20+" + initiativeBonus);
  console.log("initiativeValue", initiativeBonus);
  const initiative = new InitiativeClass(parseInt(initiativeValue));
  unit.initiative = initiative;
  initiative.owner = unit;
  InitiativeSheet.push(initiative);
}

export function removeFromInitiativeSheet(unit: Unit) {
  const initiative = unit.initiative;
  //从Initiative中移除initiative
  if (!initiative) return;
  const index = InitiativeSheet.indexOf(initiative);
  if (index !== -1) {
    InitiativeSheet.splice(index, 1);
  }
  unit.initiative = undefined;
  initiative.owner = undefined;
}

export function startCombatTurn() {
  if (!(InitiativeSheet.length > 0)) return;
  let maxInitiative = 0;
  let allNotReady = true;
  console.log("InitiativeSheet", InitiativeSheet);
  //正常行动
  initiativeCursor.pointAt = null;
  if (InitiativeSheet.length > 0) {
    for (let cursor = 0; cursor < InitiativeSheet.length; cursor++) {
      if (InitiativeSheet[cursor].ready) {
        allNotReady = false;
        if (InitiativeSheet[cursor].initativeValue > maxInitiative) {
          initiativeCursor.pointAt = InitiativeSheet[cursor];
          maxInitiative = InitiativeSheet[cursor].initativeValue;
        }
      }
    }
  }
  console.log("InitiativeSheet", InitiativeSheet);
  if (initiativeCursor.pointAt != null) {
    console.log(
      "initiativeCursor.pointAt.owner.name",
      initiativeCursor.pointAt
    );
    if (initiativeCursor.pointAt.owner) {
      alert(initiativeCursor.pointAt.owner.name + "的回合！");
    }
  }
  //所有人都行动过开启新一轮
  if (allNotReady) {
    for (let cursor = 0; cursor < InitiativeSheet.length; cursor++) {
      InitiativeSheet[cursor].ready = true;
    }
    startCombatTurn();
  }
}

export function endTurn(unit: Unit) {
  if (unit.initiative) {
    unit.initiative.ready = false;
  }
  startCombatTurn();
}

export function useMoveAction(unit: Unit) {
  if (!unit.initiative) {
    return false;
  }
  if (unit.initiative.moveActionNumber >= 1) {
    unit.initiative.moveActionNumber--;
    return true;
  }
  return false;
}

export function useStandAction(unit: Unit) {
  if (!unit.initiative) {
    return false;
  }
  if (unit.initiative.standerActionNumber >= 1) {
    unit.initiative.standerActionNumber--;
    return true;
  }
  return false;
}

export function useMinorAction(unit: Unit) {
  if (!unit.initiative) {
    return false;
  }
  if (unit.initiative.standerActionNumber >= 1) {
    unit.initiative.standerActionNumber--;
    return true;
  }
  return false;
}

export function checkActionUseful(
  unit: Unit,
  standNum: number,
  minorNum: number,
  moveNum: number
) {
  let passable = true;
  if (!unit.initiative) return false;
  if (standNum) {
    if (!(unit.initiative.standerActionNumber >= standNum)) passable = false;
  }
  if (moveNum) {
    if (!(unit.initiative.moveActionNumber >= moveNum)) passable = false;
  }
  if (minorNum) {
    if (!(unit.initiative.minorActionNumber >= minorNum)) passable = false;
  }
  return passable;
}
