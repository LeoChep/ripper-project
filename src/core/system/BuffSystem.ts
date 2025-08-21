import type { BuffInterface } from "../buff/BuffInterface";
import { Unit } from "../units/Unit";
import {
  getDoorSvg,
  getStatusEffectsIcon,
  getStatusEffectsIconUrl,
} from "@/utils/utils";
import * as PIXI from "pixi.js";
import type { UnitAnimSpirite } from "../anim/UnitAnimSprite";
import { tileSize, zIndexSetting } from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { ModifierSystem } from "./ModifierSystem";

export class BuffSystem {
  static instance: BuffSystem | null = null;

  static getInstance() {
    if (!BuffSystem.instance) {
      BuffSystem.instance = new BuffSystem();
    }
    return BuffSystem.instance;
  }
  findBuffInUnit(unit: Unit, buffId: string) {
    return unit.creature?.buffs?.find((buff) => buff.uid === buffId);
  }
  async addTo(buff: BuffInterface, unit: Unit) {
    console.log("Adding buff:", buff.name, "to unit:", unit.name);
    if (!unit.creature) {
      console.error("Unit does not have a creature associated with it.");
      return;
    }
    if (!unit.creature?.buffs) {
      unit.creature.buffs = [];
    }
    // 检查是否已存在相同的Buff
    // if (
    //   unit.creature.buffs.some(
    //     (existingBuff) => existingBuff.name === buff.name
    //   )
    // ) {
    //   console.warn(`Buff ${buff.name} is already applied to the unit.`);
    //   return;
    // }
    buff.owner = unit;
    unit.creature.buffs.push(buff);
    if (buff.modifiers.length > 0) {
      for (const modifier of buff.modifiers) {
        ModifierSystem.getInstance().updatateValueStack(unit, modifier.to);
      }
    }
    // await addIcon(buff);
    // drawBuffs(unit.animUnit!);
  }
  removeBuff(buff: BuffInterface, unit: Unit) {
    const buffs = unit.creature?.buffs;
    if (!buffs) {
      console.warn(`No buffs found for unit: ${unit.name}`);
      return;
    }
    const buffToRemove = buffs.find((b) => b === buff);
    if (!buffToRemove) {
      console.warn(`Buff ${buff.name} not found in unit: ${unit.name}`);
      return;
    }
    const index = buffs.indexOf(buffToRemove);
    if (index === undefined || index < 0) {
      console.warn(`Buff ${buff.name} not found in unit: ${unit.name}`);
      return;
    }
    console.log("移除增益效果:", buff.name, "从单位:", unit.name, buffs);
    // alert('')
    buffs.splice(index, 1);

    updataModifierByBuff(buff);
    removeIcon(buff);
    // drawBuffs(unit);
  }
}

async function updataModifierByBuff(buff: BuffInterface) {
  if (buff.modifiers.length > 0) {
    for (let modifier of buff.modifiers) {
      if (buff.owner && modifier.to)
        ModifierSystem.getInstance().updatateValueStack(
          buff.owner!,
          modifier.to
        );
    }
  }
}
async function removeIcon(buff: BuffInterface) {
  const unit = buff.owner;
  console.log("Removing icon for buff:", buff.name, "from unit:", unit?.name);
  if (!unit) {
    console.error("Buff owner is not defined.");
    return;
  }
  const animUnit = unit.animUnit;
  if (!animUnit) {
    console.error("Unit does not have an animation sprite.");
    return;
  }
  const statusIcons = animUnit.statusIcons;
  console.log("removeIcon", statusIcons[buff.uid], statusIcons);

  if (statusIcons[buff.uid]) {

    const effects = animUnit.getChildrenByLabel("effect");
    effects.forEach((effect) => {
       console.log("需要移除效果:", statusIcons[buff.uid],'实际效果',effect,'判断:',statusIcons[buff.uid] === effect);
      if (statusIcons[buff.uid] === effect) {
        console.log("移除效果:", effect);
        animUnit.removeChild(effect);
        effect.destroy();
        delete statusIcons[buff.uid];
      }
    });

    // animUnit.removeChild(statusIcons[buff.name]);
    // statusIcons[buff.name].removeChildren();
    // statusIcons[buff.name].destroy();
    // animUnit.removeChildren();
    console.log("Buff icon removed:", buff.name);
    // delete statusIcons[buff.name];
  }
}
