import * as InitiativeController from "@/core/system/InitiativeSystem";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import { golbalSetting } from "@/core/golbalSetting";
import { Drama } from "./drama";
import * as InitSystem from "@/core/system/InitiativeSystem";
import { Item, ItemRarity, ItemType, HolyWater } from "@/core/item";
import { UnitSystem } from "@/core/system/UnitSystem";
import { CharacterController } from "@/core/controller/CharacterController";
import { DramaSystem } from "@/core/system/DramaSystem";
import { lookOn } from "@/core/anim/LookOnAnim";
class LordRoom extends Drama {
  mapName: string = "lord-room";
  mapType: string = "png";
  constructor() {
    super("lord-room", "这是一个测试剧情");
  }
  loadInit() {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd, addInteraction } =
      this;
    addInteraction("领主", this.lordTalk);
  }
  play(): void {
    const startFlag = this.getVariable("startFlag");
    if (!startFlag) {
      this.setVariable("startFlag", true);
      this.startEvent();
    }
    const leaveDoor = golbalSetting.map?.doors?.find(
      (door: { id: number }) => door.id === 5
    );
    if (leaveDoor) {
      if (leaveDoor.isOpen) {
        DramaSystem.getInstance().changeScene("city_1");
      }
    }
  }
  public battleEndHandle(): void {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd } = this;
  }
  combat2EndCG = async () => {};
  combat1EndCG = async () => {};

  private lordTalk = async () => {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd } = this;
    CGstart();
    await unitSpeak("领主", "哦，罗伊斯，你先去城里逛逛，我还有些公务要处理。");
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
    const lord = UnitSystem.getInstance().getUnitByName("领主");

    lookOn(lord?.x, lord?.y);

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
      "长话短说，为了庆祝伟大的拿不丢勒将军和皇女殿下成婚，我准备了一份贵重的礼品需要你帮我送到拿不丢勒堡。我相信你能够理解，这种贵重礼物的送达至关重要，所以既要保证护送人的能力，又要保证他足够信得过。"
    );
    await unitSpeak("战士", "倒也不是离开骑士团……不过这件事我就接下了。");
    await unitSpeak("领主", "很好。稍后我会让唐宁整理相关信息。");
    await unitSpeak(
      "领主",
      "对了，城里重新开始举办耀光节。你难得来一趟，不妨多在城里逛逛。这几天晚上我都会在城堡里举行晚宴，记得来参加，多交一些高级朋友。"
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
