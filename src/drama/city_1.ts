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
    const undeadAppearFlag = this.getVariable("undeadAppearFlag");
    if (!undeadAppearFlag) {
      this.checkUndeadAppearHandle();
    }
  }
  public battleEndHandle(): void {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd } = this;
  }
  combat2EndCG = async () => {};
  combat1EndCG = async () => {};

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

    UnitSystem.getInstance()
      .getAllUnits()
      .forEach((unit) => {
        if (unit.party === "player") {
          CharacterController.curser = unit.id;
        }
      });
    await unitSpeak("战士", "真热闹啊，这就是耀光节吗。");
    await unitSpeak("战士", "总之先四处观光一下吧。");
    this.setVariable("cricleTalkUse", true);
    CGEnd();
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
    await this.unitSpeak("战士", "咦？前面好像有什么东西在动？");
    await this.speak("咯吱咯吱……");
    await DramaSystem.getInstance().unHiddenUnitsByGroup("battle1");
    await this.unitSpeak("市民", "啊！是骷髅！");
    await this.unitSpeak("战士", "骷髅？怎么会有骷髅？");
    await this.unitSpeak("市民", "救命啊！");
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
