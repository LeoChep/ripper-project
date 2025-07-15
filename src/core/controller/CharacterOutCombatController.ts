import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import * as UnitMoveSystem from "../system/UnitMoveSystem";
import * as UnitMoveAction from "../action/UnitMove";
import { generateWays } from "../utils/PathfinderUtil";
import type { TiledMap } from "../MapClass";
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
  container: PIXI.Container;
  selectedCharacter: Unit | null = null;
  rlayer: Rlayer;
  mapPassiable: TiledMap | null = null;
  constructor(
    rlayer: Rlayer,
    container: PIXI.Container<PIXI.ContainerChild>,
    mapPassiable: TiledMap
  ) {
    this.rlayer = rlayer;
    this.container = container;
    this.mapPassiable = mapPassiable;
    const ms = container.getChildByLabel("map");
    console.log("ms", ms);
    if (ms) {
      ms.eventMode = 'static';
     ms.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
      console.log("map click", e);
        this.unitMove(e);
      });
    } else {
      console.warn('Map sprite ("map") not found in container.');
    }
    // 初始化逻辑
  }
  selectCharacter(unit: Unit) {
    this.selectedCharacter = unit;
    // 处理选中角色的逻辑
    console.log("Selected character:", unit.name);
    // 可以在这里添加更多的逻辑，比如高亮显示选中的角色等
  }
  unitMove(e: PIXI.FederatedPointerEvent) {
    console.log("unitMove", e);
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
        this.mapPassiable
      );
    });

    console.log("Path generated:", path);
    UnitMoveAction.playerSelectMovement(
      e,
      this.selectedCharacter,
      this.container,
      path
    );
  }
  // 添加你的方法和属性
}
