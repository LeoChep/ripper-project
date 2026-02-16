import * as InitiativeController from "@/core/system/InitiativeSystem";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import { golbalSetting } from "@/core/golbalSetting";
import { Drama } from "./drama";
import * as InitSystem from "@/core/system/InitiativeSystem";
import { Item, ItemRarity, ItemType, HolyWater } from "@/core/item";
import { UnitSystem } from "@/core/system/UnitSystem";
import { CharacterController } from "@/core/controller/CharacterController";
class LordRoom extends Drama {
  mapName: string = "lord-room";
  mapType: string = "png";
  constructor() {
    super("lord-room", "这是一个测试剧情");
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
  combat2EndCG = async () => {};
  combat1EndCG = async () => {};

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
    if (!this.map) {
      return;
    }
    CGstart();

    await unitSpeak(
      "领主",
      "哦，罗伊斯，很高兴能见到你。你和你的父亲简直长得一模一样。"
    );
    await unitSpeak(
      "领主",
      "听说你在离开骑士团后，就组建了一只冒险者小队。我想这件事正适合你，于是就邀请了你，很高兴你能前来帮我这个年老力衰的老头子。"
    );
    await unitSpeak(
      "领主",
      "长话短说，为了庆祝伟大的拿不丢勒将军和皇女殿下成婚，城里重新开始举办耀光节，但是在这个节骨眼上，却出现了城里人陆续失踪的怪事。这简直是对拿不丢勒将军的不敬，我希望你能调查这件事，并找出真凶。"
    );
    await unitSpeak("战士", "倒也不是离开骑士团……不过这件事我就接下了。");
    await unitSpeak(
      "领主",
      "很好。稍后我会让唐宁整理相关信息。你也可以去找拉瓦苏斯中尉和警卫队了解更多线索，他在城中心的警卫处里。"
    );
    await unitSpeak(
      "领主",
      "不过，难得来一趟，不妨多在城里逛逛。这几天晚上我都会在城堡里举行晚宴，记得来参加，多交一些高级朋友。"
    );
    await unitSpeak("战士", "非常感谢您的邀请，届时我会前往。");
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

export const lordRoom = new LordRoom();
