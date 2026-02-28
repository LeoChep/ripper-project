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
class Tavern extends Drama {
  mapName: string = "tavern";
  mapType: string = "png";
  constructor() {
    super("tavern", "这是一个测试剧情");
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

 
    CGEnd();
    CharacterOutCombatController.isUse = true;
  }

  
}

export const tavern = new Tavern();
