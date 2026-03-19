import type { UnitOptions } from "./../units/Unit";
import { golbalSetting } from "../golbalSetting";
import { DramaSystem } from "../system/DramaSystem";
import { UnitSystem } from "../system/UnitSystem";
import { Unit } from "../units/Unit";
import { UuidUtil } from "../utils/UuidUtil";

export const initializeGuideGame = async () => {
  console.log(
    "[changemap0] setDramaUse 前 golbalSetting.map:",
    golbalSetting.map
  );
  const roles = await initializePlayerUnit();
  golbalSetting.playerRoles = roles;
  await DramaSystem.getInstance().setDramaUse("road");
  console.log(
    "[changemap0] setDramaUse 后 golbalSetting.map:",
    golbalSetting.map,
    "sprites:",
    golbalSetting.map?.sprites?.length
  );
};
//初始化玩家角色

export const initializePlayerUnit = async () => {
  const unitOptions = {
    name: "战士",
    unitTypeName: "manFighter",
    selectionGroup: "player",
    party: "player",
    id: 0,
    x: 0,
    y: 0,
    width: 64,
    height: 64,
  } as UnitOptions;
  const role = await UnitSystem.getInstance().createUnitCreature("manFighter", {
    name: "战士",
    unitTypeName: "player",
  });
  const unit=new Unit(unitOptions);
  if (role) {
    unit.creature=role;
  }
  else {
    unit.creature=undefined;
  }
 
  return [unit];
};
