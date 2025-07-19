import { CharacterController } from "./../controller/CharacterController";
import { getContainer, getLayers } from "@/stores/container";
import { diceRoll } from "../DiceTryer";
import type { TiledMap } from "../MapClass";
import { InitiativeClass } from "../type/InitiativeClass";
import { Unit } from "../units/Unit";
import * as PIXI from "pixi.js";
import { useInitiativeStore } from "@/stores/initiativeStore";
import { CharacterOutCombatController } from "../controller/CharacterOutCombatController";
import { appSetting, zIndexSetting } from "../envSetting";
import { SelectAnimSprite } from "../anim/SelectAnimSprite";
import { lockOn } from "../anim/LockOnAnim";
import { moveSelect } from "../controller/UnitMoveController";
import { golbalSetting } from "../golbalSetting";
import { CharacterCombatController } from "../controller/CharacterCombatController";

export const InitiativeSheet = [] as InitiativeClass[];
const initiativeCursor = {
  pointAt: null as null | InitiativeClass,
  map: null as null | TiledMap,
};

export async function addUnitsToInitiativeSheet(units: Unit[]) {
  const allAddedPromise = [] as Promise<any>[];
  units.forEach((unit) => {
    const promise = addToInitiativeSheet(unit);
    allAddedPromise.push(promise);
  });
  await Promise.all(allAddedPromise);
  return;
}
export function setMap(map: TiledMap) {
  initiativeCursor.map = map;
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
  if (initiative == initiativeCursor.pointAt) {
    endTurn(unit);
  }
  //遍历sheet
  let haveEnemy=false;
  InitiativeSheet.forEach((item) => {
    if (item.owner?.party !== "player") {
      haveEnemy = true;
    }
  });
  if (!haveEnemy) {
    //如果没有敌人了，则结束战斗
    endBattle();
  }
}

export async function startCombatTurn() {
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
      initiativeCursor.pointAt.standerActionNumber = 1;
      initiativeCursor.pointAt.moveActionNumber = 1;
      initiativeCursor.pointAt.minorActionNumber = 1;
      //设置Store
      if (initiativeCursor.pointAt.owner.initiative) {
        useInitiativeStore().setIniitiative(
          initiativeCursor.pointAt.owner.initiative
        );
      }

      //播放动画
      await playAnim(initiativeCursor.pointAt.owner);

      //设置选中角色
      if (initiativeCursor.pointAt.owner.party !== "player") {
        //如果是npc,则自动行动
        if (
          initiativeCursor.pointAt.owner.ai?.autoAction &&
          initiativeCursor.map
        ) {
          initiativeCursor.pointAt.owner.ai.autoAction(
            initiativeCursor.pointAt.owner,
            initiativeCursor.map
          );
        }
      } else {
        //提醒玩家
        const unit = initiativeCursor.pointAt.owner;
        CharacterController.curser = unit.id;
        CharacterController.selectedCharacter = unit;
        CharacterController.lookOn();
        CharacterCombatController.instance?.useMoveController();
      }
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

export async function endTurn(unit: Unit) {
   CharacterController.removeLookOn();
  if (unit.initiative) {
    unit.initiative.ready = false;
   
  }
  const stayPromisee = new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500); // 延时1秒
  });
  await stayPromisee;
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
export function startBattle() {
  CharacterOutCombatController.isUse = false;
  if (!initiativeCursor.map) {
    return;
  }
  if (!CharacterCombatController.instance) {
    CharacterCombatController.instance = new CharacterCombatController(
      initiativeCursor.map
    );
  }
  CharacterCombatController.instance.mapPassiable = initiativeCursor.map;
  CharacterCombatController.instance.inUse = true;

  return playStartAnim();
}
export async function playStartAnim() {
  const container = golbalSetting.rootContainer;
  const lineLayer = getLayers().lineLayer;
  //
  const graphics = new PIXI.Graphics();
  graphics.rect(0, 0, appSetting.width, appSetting.height);
  let color = 0xff0000; // 默认颜色为红色

  graphics.fill({ color: color, alpha: 0.5 });

  if (container && lineLayer) {
    container.addChild(graphics);
    lineLayer.attach(graphics);
  }

  const text = new PIXI.Text({
    text: "战斗开始",
    style: {
      fill: "#ffffff",
      fontSize: 48,
      fontWeight: "bold",
      align: "center",
    },
  });
  text.anchor.set(0.5);
  text.x = appSetting.width / 2;
  text.y = appSetting.height / 2;
  if (container && lineLayer) {
    container.addChild(text);
    lineLayer.attach(text);
  }
  const animPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (container) {
        container.removeChild(graphics);
        container.removeChild(text);
      }
      graphics.destroy();
      text.destroy();
      resolve();
    }, 1500);
  });
  return animPromise;
}
async function playAnim(unit: Unit) {
  const container = golbalSetting.rootContainer;
  const lineLayer = getLayers().lineLayer;
  //
  const graphics = new PIXI.Graphics();
  graphics.rect(0, 0, appSetting.width, appSetting.height);
  let color = 0xff0000; // 默认颜色为红色
  if (unit.party === "player") {
    color = 0x0000ff;
  }
  graphics.fill({ color: color, alpha: 0.5 });
  console.log("container", container);
  if (container && lineLayer) {
    container.addChild(graphics);
    lineLayer.attach(graphics);
  }
  let turnTextContent = "";
  if (unit.party === "player") {
    turnTextContent = unit.name + "的回合";
  } else {
    turnTextContent = "敌方行动";
  }
  const text = new PIXI.Text({
    text: turnTextContent,
    style: {
      fill: "#ffffff",
      fontSize: 48,
      fontWeight: "bold",
      align: "center",
    },
  });
  text.anchor.set(0.5);
  text.x = appSetting.width / 2;
  text.y = appSetting.height / 2;
  if (container && lineLayer) {
    container.addChild(text);
    lineLayer.attach(text);
  }

  // 可选：动画持续一段时间后移除
  const animPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (container) {
        container.removeChild(graphics);
        container.removeChild(text);
      }
      graphics.destroy();
      text.destroy();
      resolve();
    }, 1500);
  });
  return animPromise;
}
export function checkIsTurn(unit: Unit) {
  if (!unit.initiative) return false;
  if (initiativeCursor.pointAt && initiativeCursor.pointAt.owner === unit) {
    return true;
  }
  return false;
}
export async function endBattle() {
  // 清空InitiativeSheet
  while (InitiativeSheet.length > 0) {
    InitiativeSheet.pop();
  }
  CharacterController.removeLookOn();
  await playEndAnim();
  CharacterOutCombatController.isUse = true;
  if (CharacterCombatController.instance) {
    CharacterCombatController.instance.inUse = false;
  }
}
export async function playEndAnim() {
  const container = golbalSetting.rootContainer;
  const lineLayer = getLayers().lineLayer;
  //
  const graphics = new PIXI.Graphics();
  graphics.rect(0, 0, appSetting.width, appSetting.height);
  let color = 0x0000ff; // 默认颜色为红色

  graphics.fill({ color: color, alpha: 0.5 });

  if (container && lineLayer) {
    container.addChild(graphics);
    lineLayer.attach(graphics);
  }

  const text = new PIXI.Text({
    text: "战斗结束",
    style: {
      fill: "#ffffff",
      fontSize: 48,
      fontWeight: "bold",
      align: "center",
    },
  });
  text.anchor.set(0.5);
  text.x = appSetting.width / 2;
  text.y = appSetting.height / 2;
  if (container && lineLayer) {
    container.addChild(text);
    lineLayer.attach(text);
  }
  const animPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (container) {
        container.removeChild(graphics);
        container.removeChild(text);
      }
      graphics.destroy();
      text.destroy();
      resolve();
    }, 1500);
  });
  return animPromise;
}
