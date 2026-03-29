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
class Road extends Drama {
  mapName: string = "road";
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
    if (!this.map) {
      return;
    }
    CGstart();
    const player = UnitSystem.getInstance().getAllUnits().find((unit) => unit.party ==='player');


    lookOn(player?.x, player?.y);

 
    CGEnd();
    CharacterOutCombatController.isUse = true;
  }

  
}

export const road = new Road();
