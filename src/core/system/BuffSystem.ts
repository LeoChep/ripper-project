import type { BuffInterface } from "../buff/BuffInterface";
import type { Unit } from "../units/Unit";
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
const lineIconLimit = 4;
export class BuffSystem {
  static instance: BuffSystem | null = null;
  static getInstance() {
    if (!BuffSystem.instance) {
      BuffSystem.instance = new BuffSystem();
    }
    return BuffSystem.instance;
  }
  addTo(buff: BuffInterface, unit: Unit) {
    console.log("Adding buff:", buff.name, "to unit:", unit.name);
    if (!unit.creature) {
      console.error("Unit does not have a creature associated with it.");
      return;
    }
    if (!unit.creature?.buffs) {
      unit.creature.buffs = [];
    }
    // 检查是否已存在相同的Buff
    if (
      unit.creature.buffs.some(
        (existingBuff) => existingBuff.name === buff.name
      )
    ) {
      console.warn(`Buff ${buff.name} is already applied to the unit.`);
      return;
    }
    buff.owner = unit;
    unit.creature.buffs.push(buff);
    if (buff.modifiers.length > 0) {
      for (const modifier of buff.modifiers) {
        ModifierSystem.getInstance().updatateValueStack(unit, modifier.to);
      }
    }
    addIcon(buff);
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
    buffs.splice(index, 1);
    updataModifierByBuff(buff);
    removeIcon(buff);
    drawBuffs(unit.animUnit!);
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
  if (statusIcons[buff.name]) {
    animUnit.removeChild(statusIcons[buff.name]);
    statusIcons[buff.name].destroy();
    delete statusIcons[buff.name];
  }
}
async function addIcon(buff: BuffInterface) {
  const unit = buff.owner;
  console.log("Adding icon for buff:", buff.name, "to unit:", unit?.name);
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
  if (!statusIcons[buff.name]) {
    console.log("Adding icon for buff:", buff.name);
    const iconUrl = getStatusEffectsIconUrl(buff.icon);
    await PIXI.Assets.load(iconUrl);
    const iconContainer = new PIXI.Container();
    const iconGraphic = new PIXI.Graphics();
    iconGraphic.setStrokeStyle({ width: 2, color: "white", alpha: 1 });
    iconGraphic.lineTo(0, tileSize / lineIconLimit);
    iconGraphic.lineTo(tileSize / lineIconLimit, tileSize / lineIconLimit);
    iconGraphic.lineTo(tileSize / lineIconLimit, 0);
    iconGraphic.lineTo(0, 0);
    iconGraphic.stroke();
    iconGraphic.rect(0, 0, tileSize / lineIconLimit, tileSize / lineIconLimit);
    iconGraphic.fill(0x000000);
    iconContainer.addChild(iconGraphic);
    const iconSprite = new PIXI.Sprite(PIXI.Texture.from(iconUrl));
    iconSprite.renderable = true;
    iconSprite.scale.x = tileSize / lineIconLimit / iconSprite.width;
    iconSprite.scale.y = tileSize / lineIconLimit / iconSprite.height;
    iconContainer.addChild(iconSprite);
    iconContainer.label = "effect";
    statusIcons[buff.name] = iconContainer;
    animUnit.addChild(iconContainer);
    // golbalSetting.rlayers.spriteLayer?.attach(iconSprite);
    iconContainer.zIndex = zIndexSetting.spriteZIndex + 1;
  }
  drawBuffs(animUnit);
  console.log(buff.giver, "给", unit.name, "添加了", buff.name, "效果");
}
function drawBuffs(animUnit: UnitAnimSpirite) {
  const statusIcons = animUnit.statusIcons;
  const iconKeys = Object.keys(statusIcons);
  console.log("statusIcons", statusIcons);
  if (iconKeys.length === 0) {
    return;
  }
  let drawIndex = 0;
  iconKeys.forEach((key) => {
    const icon = statusIcons[key];
    console.log("statusIcons", icon);
    if (icon.renderable) {
      // icon.renderable=false
      drawIndex++;
      const row = Math.floor(drawIndex / lineIconLimit);
      const col =
        drawIndex % lineIconLimit == 0 ? 0 : (drawIndex % lineIconLimit) - 1;
      icon.x = col * (tileSize / lineIconLimit); // 设置图标位置
      icon.y = row * (tileSize / lineIconLimit); // 设置图标位置
    }
  });
}
