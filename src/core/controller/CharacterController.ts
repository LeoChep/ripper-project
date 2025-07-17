import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";

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

export class CharacterController {
  public static curser: number = 0;
  public static isUse:boolean = false;
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
  }
  selectCharacter(unit: Unit) {
    this.selectedCharacter = unit;
  }
  
}
