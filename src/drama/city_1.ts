import { lordRoom } from "./lord-room";
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
    if (this.getVariable("guardTalkUsed") === true) {
      addInteraction("守卫1", this.guardTalk);
      addInteraction("守卫2", this.guardTalk);
    }
    if (this.getVariable("dragonCircleTalkUsed") === true) {
      addInteraction("牧师", this.dragonCircleTalk);
    }
  }
  play(): void {
    const startFlag = this.getVariable("startFlag");
    if (!startFlag) {
      this.setVariable("startFlag", true);
      this.startEvent();
    }
    const lordRoomDoor = golbalSetting.map?.doors?.find(
      (door: { id: number }) => door.id === 35
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
    this.addInteraction("守卫1", this.guardTalk);
    this.addInteraction("守卫2", this.guardTalk);
    this.addInteraction("牧师", this.dragonCircleTalk);
    this.setVariable("guardTalkUsed", true);
    this.setVariable("dragonCircleTalkUsed", true);
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
  protected guardTalk = async () => {
    this.CGstart();
    await this.unitSpeak(
      "守卫1",
      "感谢你们的帮助。要是没有你们，我们可就麻烦了。"
    );
    const choice = await this.unitChoose("守卫1", [
      { text: "最近城还有什么别的奇怪的事情发生吗？", value: "option1" },
      { text: "亡灵相关的事情你们后续如何跟进？", value: "option2" },
      { text: "安特卫普牧师在哪？", value: "option3" },
      { text: "你们的长官在哪？", value: "option4" },
    ]);
    if (choice === "option1") {
      await this.unitSpeak(
        "守卫1",
        "最近城里是有不少人失踪，但是长官告诉我们别插手，会有专门的人来解决。"
      );
    } else if (choice === "option2") {
      await this.unitSpeak(
        "守卫1",
        "光是普通的治安问题我们就忙的焦头烂额了，长官告诉我们别插手，会有专门的人来解决。"
      );
    } else if (choice === "option3") {
      await this.unitSpeak("守卫1", "安特卫普牧师现在在城外的废弃神殿旁值守。");
    } else if (choice === "option4") {
      await this.unitSpeak(
        "守卫1",
        "就在旁边的警备处里。如果你有事要找他，最好小心点，他最近脾气暴躁的很。"
      );
    }
    this.CGEnd();
  };
  protected dragonCircleTalk = async () => {
    this.CGstart();
    const chatWithClericFlag = this.getVariable("chatWithClericFlag");
    if (!chatWithClericFlag) {
      this.setVariable("chatWithClericFlag", true);
      await this.unitSpeak("战士", "哦，你是最近大名鼎鼎的龙怒-达克吧。");
      await this.unitSpeak("牧师", "想必你就是红发的罗伊斯吧。");
      await this.unitSpeak("战士", "哈哈，谬赞了");
    }
    const clericJoinFlag = this.getVariable("clericJoinFlag");
    if (!clericJoinFlag) {
      const choice = await this.unitChoose("牧师", [
        { text: "有兴趣加入我的冒险者小队吗？", value: "option1" },
        { text: "祝你旅途愉快", value: "option2" },
      ]);
      if (choice === "option1") {
        await this.unitSpeak(
          "战士",
          "我正在寻找可靠的冒险者来加入我的小队，你看起来很有潜力。"
        );
        await this.unitSpeak(
          "牧师",
          "听起来不错，我正好也想找个队伍一起冒险。就先结伴试试看吧。"
        );
        const cleric = UnitSystem.getInstance().getUnitByName("牧师");
        if (cleric) {
          cleric.party = "player";
          golbalSetting.playerRoles.push(cleric);
          this.setVariable("clericJoinFlag", true);
        }
      } else if (choice === "option2") {
        await this.unitSpeak("战士", "祝你旅途愉快");
        await this.unitSpeak("牧师", "谢谢，你也是。");
      }
    }

    this.CGEnd();
  };
}

export const city_1 = new CITY_1();
