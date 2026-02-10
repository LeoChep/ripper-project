import { Unit } from "@/core/units/Unit";
import { CharacterController } from "./../controller/CharacterController";
import { TurnEffectAnim } from "./../anim/TurnEffectAnim";
import { getLayers } from "@/stores/container";
import { diceRoll } from "../DiceTryer";
import type { TiledMap } from "../MapClass";
import { InitiativeClass } from "../type/InitiativeClass";
import * as PIXI from "pixi.js";
import { useInitiativeStore } from "@/stores/initiativeStore";
import { CharacterOutCombatController } from "../controller/CharacterOutCombatController";
import { appSetting } from "../envSetting";

import { golbalSetting } from "../golbalSetting";
import { CharacterCombatController } from "../controller/CharacterCombatController";
import type { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import { BattleEvenetSystem } from "./BattleEventSystem";
import {
  InitiativeSerializer,
  type SerializedInitiativeData,
} from "../type/InitiativeSerializer";
import { lookOn } from "../anim/LookOnAnim";
import { DramaSystem } from "./DramaSystem";
import { MessageTipSystem } from "./MessageTipSystem";

export const InitiativeSheet = [] as InitiativeClass[];
const initiativeCursor = {
  pointAt: null as null | InitiativeClass,
  map: null as null | TiledMap,
  inBattle: false,
  lastParty: null as null | string, // 记录上一回合的方阵
  roundCount: 0, // 当前回合数
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
export const getUnits = () => {
  const units = [] as Unit[];
  InitiativeSheet.forEach((initiative) => {
    if (initiative.owner && initiative.owner.state !== "dead")
      units.push(initiative.owner);
  });
  return units;
};
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

export const removeFromInitiativehandles = [] as any[];
export function removeFromInitiativeSheet(unit: Unit) {
  const initiative = unit.initiative;
  //从Initiative中移除initiative
  if (!initiative) return;

  const index = InitiativeSheet.indexOf(initiative);
  if (index !== -1) {
    InitiativeSheet.splice(index, 1);
    removeFromInitiativehandles.forEach((func) => {
      func(unit);
    });
  }
  unit.initiative = undefined;
  initiative.owner = null;
  if (initiative == initiativeCursor.pointAt) {
    endTurn(unit);
  }
  //遍历sheet
  let haveEnemy = false;
  InitiativeSheet.forEach((item) => {
    if (
      item.owner?.party !== "player" &&
      item.owner?.state !== "dead" &&
      item.owner?.friendly !== true
    ) {
      haveEnemy = true;
    }
  });
  if (!haveEnemy) {
    //如果没有敌人了，则结束战斗
    endBattle();
  }
}

export async function startCombatTurn() {
  initiativeCursor.inBattle = true;
  if (CharacterCombatController.instance) {
    CharacterCombatController.instance.inUse = false;
  }
  if (!(InitiativeSheet.length > 0)) return;
  let maxInitiative = 0;
  let allNotReady = true;
  console.log("InitiativeSheet", InitiativeSheet);
  //正常行动
  initiativeCursor.pointAt = null;
  if (InitiativeSheet.length > 0) {
    for (let cursor = 0; cursor < InitiativeSheet.length; cursor++) {
      if (
        InitiativeSheet[cursor].ready &&
        InitiativeSheet[cursor].roundNumber <= initiativeCursor.roundCount
      ) {
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
      initiativeCursor.pointAt,
    );
    initiativeCursor.pointAt.roundNumber = initiativeCursor.roundCount;
    if (initiativeCursor.pointAt.owner) {
      initiativeCursor.pointAt.standerActionNumber = 1;
      initiativeCursor.pointAt.moveActionNumber = 1;
      initiativeCursor.pointAt.minorActionNumber = 1;
      initiativeCursor.pointAt.reactionNumber = 1;
      (
        initiativeCursor.pointAt.owner.stateMachinePack?.getMachine?.(
          "walk",
        ) as WalkStateMachine
      ).onDivideWalk = false;

      // 重置所有威能的回合标记（新回合开始）
      if (initiativeCursor.pointAt.owner.creature?.powers) {
        initiativeCursor.pointAt.owner.creature.powers.forEach((power: any) => {
          if (power.resetTurnFlag) {
            power.resetTurnFlag();
          }
        });
      }

      //设置Store
      if (initiativeCursor.pointAt.owner.initiative) {
        useInitiativeStore().setIniitiative(
          initiativeCursor.pointAt.owner.initiative,
        );
      }

      //播放动画 - 只在方阵切换时播放
      const currentParty = initiativeCursor.pointAt.owner.party;
      const shouldPlayAnim = initiativeCursor.lastParty !== currentParty;
      if (shouldPlayAnim) {
        if (initiativeCursor.pointAt.owner.friendly === true) {
          for (const func of playPlayerTurnAnnouncementAnimHandles) {
            await func(initiativeCursor.pointAt.owner);
          }
        } else {
          for (const func of playEnemyTurnAnnouncementAnimHandles) {
            await func(initiativeCursor.pointAt.owner);
          }
        }
        // await playAnim(initiativeCursor.pointAt.owner);
      }
      initiativeCursor.lastParty = currentParty;

      //设置选中角色
      if (initiativeCursor.pointAt.owner.party !== "player") {
        //如果是npc,则自动行动
        // 根据是否友军显示不同的回合效果
        MessageTipSystem.getInstance().setMessage(
          `${initiativeCursor.pointAt.owner.creature?.name}正在行动中`,
        );
        if (initiativeCursor.pointAt.owner.friendly) {
          TurnEffectAnim.showFriendlyEffect(initiativeCursor.pointAt.owner);
        } else {
          TurnEffectAnim.showEnemyEffect(initiativeCursor.pointAt.owner);
        }

        if (
          initiativeCursor.pointAt.owner.ai?.autoAction &&
          initiativeCursor.map
        ) {
          lookOn(
            initiativeCursor.pointAt.owner.x,
            initiativeCursor.pointAt.owner.y,
          );
          initiativeCursor.pointAt.owner.ai.autoAction(
            initiativeCursor.pointAt.owner,
            initiativeCursor.map,
          );
          //  endTurn(initiativeCursor.pointAt.owner);
        }
      } else {
        //提醒玩家
        MessageTipSystem.getInstance().clearMessage();
        if (CharacterCombatController.instance) {
          CharacterCombatController.instance.inUse = true;
        }
        const unit = initiativeCursor.pointAt.owner;
        CharacterController.selectCharacter(unit);
        console.log("选中单位，等待玩家操作:", unit);
        CharacterCombatController.getInstance().selectedCharacter = unit;
        initiativeCursor.pointAt.canDelay = true;
        CharacterCombatController.instance?.useMoveController();
      }

      BattleEvenetSystem.getInstance().handleEvent(
        "UnitStartTurnEvent",
        initiativeCursor.pointAt.owner,
      );
    }
  }
  //所有人都行动过开启新一轮
  if (allNotReady) {
    console.log("新一轮行动开始");
    initiativeCursor.roundCount++;
    for (let cursor = 0; cursor < InitiativeSheet.length; cursor++) {
      InitiativeSheet[cursor].ready = true;
    }
    startCombatTurn();
  }
}

export async function endTurn(unit: Unit, isDelay = false) {
  CharacterController.removeSelectEffect();
  // 移除回合效果（根据单位类型移除对应效果）

  if (unit.party !== "player") {
    if (unit.friendly) {
      TurnEffectAnim.removeFriendlyEffect(unit);
    } else {
      TurnEffectAnim.removeEnemyEffect(unit);
    }
  }

  // 减少所有威能的冷却时间（回合结束时）
  if (unit.creature?.powers) {
    unit.creature.powers.forEach((power: any) => {
      if (power.tickCooldown) {
        power.tickCooldown();
      }
    });
  }

  if (unit.initiative && isDelay === false) {
    unit.initiative.ready = false;
    unit.initiative.roundNumber++;
  }

  await BattleEvenetSystem.getInstance().handleEvent("UnitEndTurnEvent", unit);
  //移除单位的状态
  const stayPromisee = new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500); // 延时1秒
  });

  await stayPromisee;
  MessageTipSystem.getInstance().clearMessage();
  if (initiativeCursor.inBattle === false) {
    return;
  }
  startCombatTurn();
}
export function isInBattle() {
  return initiativeCursor.inBattle;
}
export function useReaction(unit: Unit) {
  if (!unit.initiative) {
    return false;
  }
  // if (initiativeCursor.pointAt?.owner === unit) {
  //   return false; // 如果当前回合单位是自己，则不能使用反应
  // }
  if (unit.initiative.reactionNumber >= 1) {
    unit.initiative.reactionNumber--;
    return true;
  }
  return false;
}
export function useMoveAction(unit: Unit) {
  if (!unit.initiative) {
    return false;
  }
  if (unit.initiative.moveActionNumber >= 1) {
    unit.initiative.moveActionNumber--;
    return true;
  } else {
    return useStandAction(unit);
  }
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
  if (unit.initiative.minorActionNumber >= 1) {
    unit.initiative.minorActionNumber--;
    return true;
  } else {
    return useMoveAction(unit);
  }
}
export function useAction(unit: Unit, actionType: string) {
  if (!unit.initiative) {
    return false;
  }
  if (actionType === "standard") {
    if (unit.initiative.standerActionNumber >= 1) {
      unit.initiative.standerActionNumber--;
      return true;
    }
  }
  if (actionType === "move") {
    if (unit.initiative.moveActionNumber >= 1) {
      unit.initiative.moveActionNumber--;
      return true;
    }
  }
  if (actionType === "minor") {
    if (unit.initiative.minorActionNumber >= 1) {
      unit.initiative.minorActionNumber--;
      return true;
    }
  }
  if (actionType === "reaction") {
    useReaction(unit);
  }
  return false;
}
export function checkRectionUseful(unit: Unit) {
  if (!unit.initiative) {
    return false;
  }
  if (initiativeCursor.pointAt?.owner === unit) {
    return false; // 如果当前回合单位是自己，则不能使用反应
  }
  if (unit.initiative.reactionNumber >= 1) {
    return true;
  }
  return false;
}
export function checkActionUseful(unit: Unit, actionType: string) {
  let passable = true;
  if (!unit.initiative) return false;
  if (actionType === "standard") {
    if (!(unit.initiative.standerActionNumber >= 1)) passable = false;
  }
  if (actionType === "move") {
    if (!(unit.initiative.moveActionNumber >= 1)) passable = false;
  }
  if (actionType === "minor") {
    if (!(unit.initiative.minorActionNumber >= 1)) passable = false;
  }
  if (actionType === "reaction") {
    if (!(unit.initiative.reactionNumber >= 1)) passable = false;
  }
  return passable;
}

export function startBattle() {
  CharacterOutCombatController.isUse = false;
  if (!initiativeCursor.map) {
    return;
  }
  if (!CharacterCombatController.instance) {
    CharacterCombatController.instance = new CharacterCombatController();
  }
  CharacterCombatController.instance.inUse = true;
  initiativeCursor.map.sprites.forEach((unit) => {
    const u = unit as Unit;
    if (unit.party === "player") {
      if (!u.creature) {
        return;
      }
      u.creature.traits.forEach((trait) => {
        if ((trait.hookTime = "Battle")) {
          trait.hook();
        }
      });
      console.log("unitForBattle", u);
      u.creature.powers.forEach((power) => {
        console.log("powerForBattle", power);
        if (power.hookTime === "Battle") {
          power.hook();
        }
      });
    }
  });
  initiativeCursor.roundCount = 1;
  return playStartAnim();
}
export const loadBattleUIhandles = [] as any[];
export async function playStartAnim() {
  const container = golbalSetting.tipContainer;
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
  animPromise.then(() => {
    loadBattleUI();
  });
  return animPromise;
}
export const clearBattleUIhandles = [] as any[];
export function clearBattleUI() {
  clearBattleUIhandles.forEach((func) => {
    func();
  });
  console.log("clearBattleUIhandles", clearBattleUIhandles);
}
export const loadBattleUI = () => {
  loadBattleUIhandles.forEach((func) => {
    func();
  });
  console.log("loadBattleUIhandles", loadBattleUIhandles);
  console.log(
    "loadBattleUI called",
    playEnemyTurnAnnouncementAnimHandles,
    playPlayerTurnAnnouncementAnimHandles,
  );
};
export const playEnemyTurnAnnouncementAnimHandles = [] as any[];
export const playPlayerTurnAnnouncementAnimHandles = [] as any[];
async function playAnim(unit: Unit) {
  const container = golbalSetting.tipContainer;
  const lineLayer = getLayers().lineLayer;
  //
  const graphics = new PIXI.Graphics();
  graphics.rect(
    -(container?.x ?? 0),
    -(container?.y ?? 0),
    appSetting.width,
    appSetting.height,
  );
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
    //turnTextContent = unit.name + "的回合";
    turnTextContent = "我方行动";
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
  text.x = appSetting.width / 2 - (container?.x ?? 0);
  text.y = appSetting.height / 2 - (container?.y ?? 0);
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
  console.log("checkIsTurn", unit, initiativeCursor.pointAt);
  if (
    initiativeCursor.pointAt &&
    initiativeCursor.pointAt.owner?.id === unit.id
  ) {
    return true;
  }
  return false;
}
export async function endBattle() {
  // 清空InitiativeSheet
  initiativeCursor.inBattle = false;
  initiativeCursor.lastParty = null;
  while (InitiativeSheet.length > 0) {
    InitiativeSheet.pop();
  }

  await endTurn(CharacterController.selectedCharacter as Unit);
  CharacterController.removeSelectEffect();

  await playEndAnim();
        DramaSystem.getInstance().battleEndHandle();
      initiativeCursor.inBattle = false;
      while (InitiativeSheet.length > 0) InitiativeSheet.pop();
  CharacterOutCombatController.isUse = true;
  if (CharacterCombatController.instance) {
    CharacterCombatController.instance.inUse = false;
  }
}
export async function playEndAnim() {
  const container = golbalSetting.tipContainer;
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
      MessageTipSystem.getInstance().clearMessage();
      resolve();

      clearBattleUI();
    }, 1500);
  });
  return animPromise;
}
export function getInitRecord() {
  const initSheet = InitiativeSerializer.serializeArray(InitiativeSheet);
  const initRecord = {
    initiativeSheet: initSheet,
    inBattle: initiativeCursor.inBattle,
    roundCount: initiativeCursor.roundCount,
    initiativeCursor: {
      pointAt: initiativeCursor.pointAt?.owner?.id.toString(),
    },
  };
  return initRecord;
}
export function getPointAtUnit() {
  return initiativeCursor.pointAt?.owner || null;
}
export function getPointAtInitiative() {
  return initiativeCursor.pointAt || null;
}

/**
 * 延迟单位的先攻顺序
 * @param unitId 要延迟的单位ID
 * @param delayToNumber 延迟到的先攻值
 */
export function delay(unitId: number, delayToNumber: number) {
  // 查找要延迟的单位
  const unit = getUnits().find((u) => u.id === unitId);

  if (!unit) {
    console.error(`Unit with id ${unitId} not found`);
    return;
  }

  if (!unit.initiative) {
    console.error(`Unit ${unit.name} doesn't have initiative value`);
    return;
  }

  const oldValue = unit.initiative.initativeValue;

  // 直接设置新的先攻值
  unit.initiative.initativeValue = delayToNumber;
  if (delayToNumber > oldValue) {
    unit.initiative.roundNumber++;
  }
  console.log(
    `Delayed initiative: ${unit.name} from ${oldValue} to ${delayToNumber}`,
  );
}
export function loadInitRecord(initRecord: {
  initiativeSheet: InitiativeSerializer[];
  inBattle: boolean;
  roundCount?: number;
  initiativeCursor: { pointAt: string };
}) {
  initiativeCursor.map = golbalSetting.map;
  const initiativeSheet = InitiativeSerializer.deserializeArray(
    initRecord.initiativeSheet,
    (uid: string) => {
      return golbalSetting.map?.sprites.find(
        (item) => item.id.toString() === uid,
      );
    },
  );
  InitiativeSheet.splice(0, InitiativeSheet.length, ...initiativeSheet);
  initiativeCursor.inBattle = initRecord.inBattle;
  initiativeCursor.roundCount = initRecord.roundCount ?? 1;
  console.log("initiativeCursor", initRecord);
  if (initRecord.initiativeCursor.pointAt) {
    const pointAtId = parseInt(initRecord.initiativeCursor.pointAt);
    console.log("pointAtId", pointAtId);
    // 查找对应的 InitiativeClass
    initiativeCursor.pointAt =
      InitiativeSheet.find((item) => item.owner?.id === pointAtId) || null;

    console.log("LOAD INIT", initiativeSheet, initiativeCursor);
  } else {
    initiativeCursor.pointAt = null;
  }
  loadBattleUI();
}
