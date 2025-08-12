import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import * as UnitMoveSystem from "../system/UnitMoveSystem";
import * as UnitMoveAction from "../action/UnitMove";
import { generateWays } from "../utils/PathfinderUtil";
import type { TiledMap } from "../MapClass";

import { golbalSetting } from "../golbalSetting";
import { CharacterController } from "./CharacterController";
import { useTalkStateStore } from "@/stores/talkStateStore";
const tileSize = 64;

type Rlayer = {
  basicLayer: PIXI.IRenderLayer;
  spriteLayer: PIXI.IRenderLayer;
  lineLayer: PIXI.IRenderLayer;
  fogLayer: PIXI.IRenderLayer;
  selectLayer: PIXI.IRenderLayer;
  controllerLayer: PIXI.IRenderLayer;
};

export class CharacterOutCombatController {
  public static isUse: boolean = false;
  static instance: CharacterOutCombatController | null = null;
  public static getInstance() {
    if (!CharacterOutCombatController.instance) {
      CharacterOutCombatController.instance =
        new CharacterOutCombatController();
    }
    return CharacterOutCombatController.instance;
  }
  selectedCharacter: Unit | null = null;

  constructor() {
    const ms = golbalSetting.mapContainer;
    if (ms) {
      console.log("ms", ms);
      ms.eventMode = "static";
      ms.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
        console.log("map click", e);

        if (!CharacterOutCombatController.isUse) {
          return;
        }
        this.unitMove(e);
      });
    } else {
      console.warn('Map sprite ("map") not found in container.');
    }
    // 初始化逻辑
  }

  unitMove(e: PIXI.FederatedPointerEvent) {
    const mapPassiable = golbalSetting.map;
    if (useTalkStateStore().talkState.onCg) {
      return;
    }
    console.log("unitMove", e);
    this.selectedCharacter = mapPassiable?.sprites.find(
      (sprite) => sprite.id === CharacterController.curser
    );
    if (!this.selectedCharacter) {
      console.warn("No character selected for movement.");
      return;
    }
    const startX = Math.floor(this.selectedCharacter.x / tileSize);
    const startY = Math.floor(this.selectedCharacter.y / tileSize);
    const path = generateWays(startX, startY, 20, (x, y, preX, preY) => {
      return UnitMoveSystem.checkPassiable(
        this.selectedCharacter!,
        preX * tileSize,
        preY * tileSize,
        x * tileSize,
        y * tileSize,
        mapPassiable
      );
    });

    console.log("Path generated:", path);
    const result = {} as any;
    const container = golbalSetting.rootContainer;
    if (!container) return;
    UnitMoveAction.playerSelectMovement(
      e,
      this.selectedCharacter,
      container,
      path,
      result
    );
  }
  // 添加你的方法和属性
}
