import * as InitiativeController from "@/core/system/InitiativeSystem";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import { golbalSetting } from "@/core/golbalSetting";
import { Drama } from "./drama";
import * as InitSystem from "@/core/system/InitiativeSystem";
import { Item, ItemRarity, ItemType, HolyWater } from "@/core/item";
import { UnitSystem } from "@/core/system/UnitSystem";
import { CharacterController } from "@/core/controller/CharacterController";
class D1 extends Drama {
  mapName: string = "A";
  constructor() {
    super("d1", "这是一个测试剧情");
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
    const door1Flag = this.getVariable("door1");
    console.log("门1的状态:", door1Flag);
    if (!door1Flag) {
      this.door1Event();
    }
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
  }
  combat1EndCG = async () => {
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

    await unitSpeak("npc牧师", "谢谢你们！那些骷髅终于被消灭了。");
    await unitSpeak(
      "npc牧师",
      "不过我担心这只是个开始，神殿里可能还有更多的亡灵在徘徊。我们需要继续前进，彻底清理这里的邪恶力量。"
    );
    await unitChoose("npc牧师", [
      { text: "我们准备好了，继续前进吧。", value: "option1" },
      { text: "我们需要休息一下，恢复体力……", value: "option2" },
    ]);
    await speak("突然……传来一阵响动……");
    await speak("你们发现更多的骷髅从神殿的深处涌了出来。");
    await unitSpeak("npc牧师", "看起来我们还有更多的敌人要面对！准备战斗吧！");
    const hiddenUnits =
      UnitSystem.getInstance().getSceneHiddenUnitsBySelectionGroup("battle2");
    for (const unit of hiddenUnits) {
      await unHiddenUnit(unit.name);
    }
      const units = UnitSystem.getInstance().getUnitBySelectionGroup("battle2");
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
    CGEnd();
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
    // await unHiddenUnit("bigSkeleton2");

    await unitSpeak(
      "npc牧师",
      "你们终于来了……这里的亡灵作祟越来越可怕了，我们需要你们的帮助来消灭它们。"
    );
    await speak("你们能听见神殿里传来骨头摩擦的声音，似乎有骷髅在里面徘徊。");
    await unitSpeak(
      "npc牧师",
      "培罗在上，我感觉它们简直随时都可能冲出来攻击我们。  还请你们小心行事。"
    );

    addInteraction("npc牧师", this.cricleTalk);
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

export const d1 = new D1();
