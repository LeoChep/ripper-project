import type { TiledMap } from "@/core/MapClass";
import { useTalkStateStore } from "@/stores/talkStateStore";
import * as InitiativeController from "@/core/system/InitiativeSystem";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import { golbalSetting } from "@/core/golbalSetting";
import { DramaSystem } from "@/core/system/DramaSystem";

export const d1 = {
  name: "d1",
  description: "这是一个测试剧情",
  map: null as TiledMap | null,
  variables: new Map<string, any>(),
  load(variables: { name: string; value: any }[]): void {
    d1.variables.clear();
    if (!variables) {
      return;
    }
    variables = [...variables];
    console.log("加载剧情变量:", variables);
    for (let i = 0; i < variables.length; i++) {
      d1.variables.set(variables[i].name, variables[i].value);
    }
    d1.map= golbalSetting.map;
  },
  getVariable(key: string): any {
    if (!d1.variables.has(key)) {
      console.warn(`Variable "${key}" not found in drama variables.`);
      d1.setVariable(key, false);
    }
    return d1.variables.get(key);
  },
  setVariable(key: string, value: any): void {
    d1.variables.set(key, value);
  },
  play: () => {
    const startFlag = d1.getVariable("startFlag");
    if (!startFlag) {
      d1.setVariable("startFlag", true);
      startEvent();
    }
    const door1Flag = d1.getVariable("door1");
    console.log("门1的状态:", door1Flag);
    if (!door1Flag) {
      door1Event();
    }
  },
};

const startEvent = async () => {
  const dramaSystem= DramaSystem.getInstance();
  dramaSystem.CGstart();
  await dramaSystem.speak(
    "你醒来时，发现自己躺在一片荒野上，四周一片寂静。你感到头痛欲裂，似乎刚刚经历了一场激烈的战斗。你环顾四周，发现自己身处一个陌生的地方，四周只有一些破旧的建筑和荒芜的土地。你决定站起来，寻找出路。"
  );
  await dramaSystem.speak(
    "你站起身来，感到身体有些虚弱，发现这里一片荒凉，建筑物大多破败不堪。突然,你听到一阵低语声。你停下脚步，仔细聆听，发现声音来自一座废弃的房屋。你决定走近一探究竟。"
  );

  dramaSystem.CGEnd();
  CharacterOutCombatController.isUse = true;
};

const door1Event = async () => {
  const dramaSystem= DramaSystem.getInstance();
  const door1 = golbalSetting.map?.edges?.find(
    (edge: { id: number }) => edge.id === 44
  );
  if (door1?.useable === true) {
    return;
  }

  dramaSystem.CGstart();
  d1.setVariable("door1", true);
  await dramaSystem.speak(
    "你走近废弃的房屋，发现门口有一扇破旧的门。你试图推开门，但它似乎被什么东西卡住了。你决定用力推开它。"
  );
  await dramaSystem.unitSpeak("skeleton","骷髅：咯吱吱……咯吱吱");
  dramaSystem.CGEnd();
  //开始战斗
  if (!d1.map) {
    return;
  }
  InitiativeController.setMap(d1.map);
  const initCombatPromise = InitiativeController.addUnitsToInitiativeSheet(
    d1.map.sprites
  );
  initCombatPromise.then(async () => {
    await InitiativeController.startBattle();
    InitiativeController.startCombatTurn();
  });
};
