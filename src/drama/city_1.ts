import * as InitiativeController from "@/core/system/InitiativeSystem";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import { golbalSetting } from "@/core/golbalSetting";
import { Drama } from "./drama";
import * as InitSystem from "@/core/system/InitiativeSystem";
import { Item, ItemRarity, ItemType, HolyWater } from "@/core/item";
import { UnitSystem } from "@/core/system/UnitSystem";
import { CharacterController } from "@/core/controller/CharacterController";
class CITY_1 extends Drama {
  mapName: string = "city_1";
  constructor() {
    super("city_1", "这是一个测试剧情");
  }
  loadInit() {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd, addInteraction } =
      this;
    const cricleTalkUse = this.getVariable("cricleTalkUse");
    if (cricleTalkUse) {
      addInteraction("npc牧师", this.cricleTalk);
    }
  }
  play(): void {
    const startFlag = this.getVariable("startFlag");
    if (!startFlag) {
      this.setVariable("startFlag", true);
      this.startEvent();
    }
   
  }
  public battleEndHandle(): void {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd } = this;
    
  }
  combat2EndCG = async () => {
  
  };
  combat1EndCG = async () => {
   
  };

  cricleTalk = async () => {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd } = this;
    if (InitSystem.isInBattle()) {
      return;
    }
    CGstart();
    const ch1 = await unitChoose(
      "npc牧师",
      [
        { text: "你发现这种情况多久了？", value: "option1" },
        { text: "它们有什么弱点吗？", value: "option2" },
        { text: "这座神殿原本是哪个神明的？", value: "option3" },
        { text: "你能提供什么帮助吗？", value: "option4" },
      ],
      "还有什么事吗"
    );

    if (ch1 == "option1")
      await unitSpeak(
        "npc牧师",
        "大约一周前，我开始注意到这些异常现象。起初只是有鬼魂在废弃神殿中呢喃，但现在已经变得越来越严重了。"
      );
    if (ch1 == "option2") {
      await unitSpeak(
        "npc牧师",
        "它们畏惧阳光，所以一直在神殿里没有出来。圣水对他们或许也有用……"
      );

      const hasHolyWater = this.getVariable("hasHolyWater");
      if (!hasHolyWater) {
        const item = new HolyWater();
        const unit = CharacterController.selectedCharacter;

        unit?.addItem(item);

        await speak("你获得了道具：圣水");
        this.setVariable("hasHolyWater", true);
      }
    }

    if (ch1 == "option3")
      await unitSpeak(
        "npc牧师",
        "这座神殿原本时祭拜古拉姆的……但是你也知道，古拉姆已经不在了，各种意义上，因此神殿也废弃了。"
      );
    if (ch1 == "option4")
      await unitSpeak(
        "npc牧师",
        "我能做的并不多，但是我会尽我所能使用神术法术来攻击它们。但是别指望太多，我毕竟不是战斗人员。"
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


    await unitSpeak(
      "npc牧师",
      "我会向领主报告此事，你们暂时现在城里逛逛吧。"
    );
   
    this.setVariable("cricleTalkUse", true);
    CGEnd();
    CharacterOutCombatController.isUse = true;
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
