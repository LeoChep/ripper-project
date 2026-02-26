import { lordRoom } from './lord-room';
import * as InitiativeController from "@/core/system/InitiativeSystem";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import { golbalSetting } from "@/core/golbalSetting";
import { Drama } from "./drama";
import * as InitSystem from "@/core/system/InitiativeSystem";
import { Item, ItemRarity, ItemType, HolyWater } from "@/core/item";
import { UnitSystem } from "@/core/system/UnitSystem";
import { CharacterController } from "@/core/controller/CharacterController";
import { appSetting } from "@/core/envSetting";
import { Polygon } from "pixi.js";
import { DramaSystem } from "@/core/system/DramaSystem";
import { findSpaceGrid, moveNear } from "@/core/system/UnitMoveSystem";
import { moveMovement } from "@/core/action/UnitMove";
class CITY_1 extends Drama {
  mapName: string = "city_1";
  mapType: string = "jpg";
  constructor() {
    super("city_1", "这是一个测试剧情");
  }
  loadInit() {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd, addInteraction } =
      this;
  }
  play(): void {
    const startFlag = this.getVariable("startFlag");
    if (!startFlag) {
      this.setVariable("startFlag", true);
      this.startEvent();
    }
        const lordRoomDoor = golbalSetting.map?.doors?.find(
      (door: { id: number }) => door.id === 30
    );
    if (lordRoomDoor) {
      if (lordRoomDoor.isOpen) {
        DramaSystem.getInstance().changeScene("lord-room");
      }
    }
    const undeadAppearFlag = this.getVariable("undeadAppearFlag");
    if (!undeadAppearFlag) {
      this.checkUndeadAppearHandle();
    }
  }

  combat2EndCG = async () => {};
  combat1EndCG = async () => {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd } = this;
    CGstart();
    await speak("你成功击败了那些骷髅，这里暂时恢复了平静。");
    const guard = UnitSystem.getInstance().getUnitByName("守卫1");
    if (!guard) {
      console.error("卫兵1不存在");
      CGEnd();
      return;
    }
    await moveNear( 
      guard,
      golbalSetting.playerRoles[0].x,
      golbalSetting.playerRoles[0].y
    );

    await unitSpeak("守卫1", "感谢你们的帮助。要是没有你们，我们可就麻烦了。");
    await unitSpeak("战士", "责无旁贷。不过这里怎么会有骷髅。");
    await unitSpeak(
      "守卫1",
      "实不相瞒，自从耀光节宣布要举办后，城里发生的怪事越来越多……我怀疑是有将军的反对者在进行破坏。"
    );
    await unitSpeak("战士", "……");
    await unitSpeak(
      "守卫1",
      "关于亡灵，最近培罗神殿的牧师也汇报过相关的情况，说是城外废弃神殿里有亡灵出没。最近一个叫安特卫普的牧师反应过这件事，并且向城主要求招募冒险者来解决这事。他现在在城外的废弃神殿旁值守。"
    );
    CGEnd();
  };

  private async startEvent(): Promise<void> {
    const {
      CGstart,
      unitSpeak,
      speak,
      unitChoose,
      CGEnd,
      addInteraction,
      unHiddenUnit,
    } = this;

    CGstart();

    await unitSpeak("战士", "真热闹啊，这就是耀光节吗。");
    await unitSpeak("战士", "总之先四处观光一下吧。");

    CGEnd();
    UnitSystem.getInstance()
      .getAllUnits()
      .forEach((unit) => {
        if (unit.party === "player") {
          CharacterController.curser = unit.id;
        }
      });
    CharacterOutCombatController.isUse = true;
  }
  async checkUndeadAppearHandle() {
    const polygon = new Polygon([
      1430, 1030, 2630, 1030, 2630, 2080, 1430, 2080,
    ]);
    const players = golbalSetting.playerRoles;
    let isInPolygon = false;
    players.forEach((player) => {
      if (polygon.contains(player.x, player.y)) {
        isInPolygon = true;
      }
    });
    if (!isInPolygon) {
      return;
    }
    this.CGstart();
    this.setVariable("undeadAppearFlag", true);
    await this.speak("咯吱咯吱……");
    await DramaSystem.getInstance().unHiddenUnitsByGroup("battle1");
    await this.unitSpeak("女市民", "啊！是骷髅！");
    await this.unitSpeak("战士", "骷髅？怎么会有骷髅？");
    await this.unitSpeak("女市民", "救命啊！");
    await this.unitSpeak("战士", "看来只能先把它们解决了。");

    this.setVariable("inCombat1", true);
    if (!golbalSetting.map) {
      return;
    }
    InitiativeController.setMap(golbalSetting.map);
    const units = UnitSystem.getInstance().getUnitBySelectionGroup("battle1");

    const initCombatPromise = Promise.all([
      InitiativeController.addUnitsToInitiativeSheet(units),
      InitiativeController.addUnitsToInitiativeSheet(players),
    ]);
    initCombatPromise.then(async () => {
      await InitiativeController.startBattle();
      InitiativeController.startCombatTurn();
    });
    this.CGEnd();
  }
  public battleEndHandle(): void {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd } = this;
    const inCombat1 = this.getVariable("inCombat1");
    const combat1EndCgUsed = this.getVariable("combat1EndCgUsed");
    if (inCombat1 && combat1EndCgUsed !== true) {
      this.setVariable("combat1EndCgUsed", true);
      this.setVariable("inCombat1", false);
      this.combat1EndCG();
    }
    if (
      this.getVariable("inCombat2") &&
      this.getVariable("combat2EndCgUsed") !== true
    ) {
      this.setVariable("combat2EndCgUsed", true);
      this.setVariable("inCombat2", false);
      this.combat2EndCG();
    }
  }
  private async door1Event(): Promise<void> {
    const { CGstart, speak, unitSpeak, CGEnd } = this;

    const door1 = golbalSetting.map?.doors?.find(
      (door: { id: number }) => door.id === 86
    );
    if (!door1) return;
    if (door1?.isOpen === false) {
      return;
    }

    CGstart();
    this.setVariable("door1", true);
    await speak(
      "你走近废弃的房屋,发现门口有一扇破旧的门。你试图推开门,但它似乎被什么东西卡住了。你决定用力推开它。"
    );
    await unitSpeak("skeleton", "骷髅:咯吱吱……咯吱吱");
    CGEnd();
    //开始战斗
    if (!this.map) {
      return;
    }
    this.setVariable("inCombat1", true);
    InitiativeController.setMap(this.map);
    const units = UnitSystem.getInstance().getUnitBySelectionGroup("battle1");
    const players = UnitSystem.getInstance().getUnitBySelectionGroup("player");
    players.forEach((player) => {
      units.push(player);
    });
    const initCombatPromise =
      InitiativeController.addUnitsToInitiativeSheet(units);

    initCombatPromise.then(async () => {
      await InitiativeController.startBattle();
      InitiativeController.startCombatTurn();
    });
  }
}

export const city_1 = new CITY_1();
