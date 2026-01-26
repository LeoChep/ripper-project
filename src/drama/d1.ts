import * as InitiativeController from "@/core/system/InitiativeSystem";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import { golbalSetting } from "@/core/golbalSetting";
import { DramaSystem } from "@/core/system/DramaSystem";
import { Drama } from "./drama";

class D1 extends Drama {
  constructor() {
    super("d1", "这是一个测试剧情");
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

  private async startEvent(): Promise<void> {
    const dramaSystem = DramaSystem.getInstance();
    dramaSystem.CGstart();
    await dramaSystem.unitSpeak(
      "npc牧师",
      "你们终于来了……这里的亡灵作祟越来越可怕了，我们需要你们的帮助来消灭它们。",
    );
    await dramaSystem.speak(
      "你们能听见神殿里传来骨头摩擦的声音，似乎有骷髅在里面徘徊。",
    );
    await dramaSystem.unitSpeak(
      "npc牧师",
      "培罗在上，我感觉它们简直随时都可能冲出来攻击我们。  还请你们小心行事。",
    );

    const ch1 = await dramaSystem.unitChoose(
      "npc牧师",
      [
        { text: "你发现这种情况多久了？", value: "option1" },
        { text: "它们有什么弱点吗？", value: "option2" },
      ],
      "还有什么事吗",
    );

    if (ch1 == "option1")
      await dramaSystem.unitSpeak(
        "npc牧师",
        "大约一周前，我开始注意到这些异常现象。起初只是有鬼魂在废弃神殿中呢喃，但现在已经变得越来越严重了。",
      );
    if (ch1 == "option2")
      await dramaSystem.unitSpeak(
        "npc牧师",
        "它们畏惧阳光，所以一直在神殿里没有出来。圣水对他们或许也有用……",
      );
    dramaSystem.CGEnd();
    CharacterOutCombatController.isUse = true;
  }

  private async door1Event(): Promise<void> {
    const dramaSystem = DramaSystem.getInstance();
    const door1 = golbalSetting.map?.edges?.find(
      (edge: { id: number }) => edge.id === 44,
    );
    if (door1?.useable === true) {
      return;
    }

    dramaSystem.CGstart();
    this.setVariable("door1", true);
    await dramaSystem.speak(
      "你走近废弃的房屋，发现门口有一扇破旧的门。你试图推开门，但它似乎被什么东西卡住了。你决定用力推开它。",
    );
    await dramaSystem.unitSpeak("skeleton", "骷髅：咯吱吱……咯吱吱");
    dramaSystem.CGEnd();
    //开始战斗
    if (!this.map) {
      return;
    }
    InitiativeController.setMap(this.map);
    const initCombatPromise = InitiativeController.addUnitsToInitiativeSheet(
      this.map.sprites,
    );
    initCombatPromise.then(async () => {
      await InitiativeController.startBattle();
      InitiativeController.startCombatTurn();
    });
  }
}

export const d1 = new D1();


