import * as PIXI from "pixi.js";
import { createDoorFromDoorObj, Door } from "./units/Door";
import { Chest, createChestFromBoxObj } from "./units/Chest";
import { ChestSystem } from "./system/ChestSystem";

// 单个区块（chunk）
export interface TiledMapChunk {
  data: number[];
  height: number;
  width: number;
  x: number;
  y: number;
}

// 对象层中的对象
export interface TiledMapObject {
  height: number;
  id: number;
  name: string;
  polygon?: Array<{ x: number; y: number }>;
  polyline?: Array<{ x: number; y: number }>;
  onlyVisiton?: string; // 是否只可见
  onlyBlock?: string; // 是否只阻挡
  properties: any[];
  rotation: number;
  type: string;
  visible: boolean;
  width: number;
  x: number;
  y: number;
}

// 图层
export interface TiledMapLayer {
  // tilelayer
  chunks?: TiledMapChunk[];
  data?: number[];
  height?: number;
  width?: number;
  id: number;
  name: string;
  offsetx?: number;
  offsety?: number;
  opacity: number;
  startx?: number;
  starty?: number;
  type: string;
  visible: boolean;
  x: number;
  y: number;
  // objectgroup
  draworder?: string;
  objects?: TiledMapObject[];
}

// tileset
export interface TiledMapTileset {
  columns: number;
  firstgid: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin: number;
  name: string;
  spacing: number;
  tilecount: number;
  tileheight: number;
  tilewidth: number;
}

// 主地图类
export class TiledMap {
  compressionlevel: number;
  height: number;
  infinite: boolean;
  layers: TiledMapLayer[];
  nextlayerid: number;
  nextobjectid: number;
  orientation: string;
  renderorder: string;
  tiledversion: string;
  tileheight: number;
  tilesets: TiledMapTileset[];
  tilewidth: number;
  type: string;
  version: string;
  width: number;
  edges: Array<{
    onlyBlock: boolean;
    onlyVisition: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    id: number;
    useable: boolean;
  }> = [];
  textures?: PIXI.Sprite;
  sprites: any[] = [];
  doors: Door[] = [];
  chests: Chest[] = [];
  constructor(data: any, textures: any) {
    this.compressionlevel = data.compressionlevel;
    this.height = data.height;
    this.infinite = data.infinite;
    this.layers = data.layers;
    this.nextlayerid = data.nextlayerid;
    this.nextobjectid = data.nextobjectid;
    this.orientation = data.orientation;
    this.renderorder = data.renderorder;
    this.tiledversion = data.tiledversion;
    this.tileheight = data.tileheight;
    this.tilesets = data.tilesets;
    this.tilewidth = data.tilewidth;
    this.type = data.type;
    this.version = data.version;
    this.width = data.width;
    this.initEdges()
    this.initDoors();
    if (textures) {
      this.textures = new PIXI.Sprite(textures);
    }
    // 初始化 sprites 属性
    const spriteLayer = this.layers.find(
      (l) => l.type === "objectgroup" && l.name === "sprite",
    );
    if (spriteLayer && spriteLayer.objects) {
      this.sprites = spriteLayer.objects;
    }

    // 初始化宝箱
    const boxLayer = this.layers.find(
      (l) => l.type === "objectgroup" && l.name === "box",
    );
    if (boxLayer && boxLayer.objects) {
      this.chests = boxLayer.objects as any;

      console.log("Initialized chests:", this.chests);
    }
  }
  initDoors() {
    const doorLayer = this.layers.find(
      (l) => l.type === "objectgroup" && l.name === "door",
    );
    if (doorLayer && doorLayer.objects) {
      this.doors = doorLayer.objects.map((obj) =>
        createDoorFromDoorObj(obj),
      );
    }
  }
  initEdges() {
    const layers = this.layers;
    const objectsGroups = layers.filter(
      (layer) => layer.type === "objectgroup" && layer.name === "wall",
    );
    const edges: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      id: number;
      useable: boolean;
      onlyVisition: boolean;
      onlyBlock: boolean;
    }[] = [];
    objectsGroups.forEach((objectsGroup) => {
      if (objectsGroup && objectsGroup.objects) {
        objectsGroup.objects.forEach((object) => {
          const onlyVisitionProp = object.properties?.find(
            (p: any) => p.name === "onlyVisition",
          );
          const onlyBlockProp = object.properties?.find(
            (p: any) => p.name === "onlyBlock",
          );
          console.log(
            "objectFOwal",
            onlyVisitionProp && onlyVisitionProp.value === "true"
              ? true
              : false,
            onlyBlockProp && onlyBlockProp.value === "true" ? true : false,
            object,
          );

          // 检查对象是否有polygon属性
          let polys = null;
          let type = null;
          let id = object.id;
          if (object.polygon && object.polygon.length >= 0) {
            polys = object.polygon;
            type = "polygon";
          }

          if (object.polyline && object.polyline.length >= 0) {
            // 检查对象是否有polyline属性
            type = "polyline";
            polys = object.polyline;
          }

          if (polys && polys.length >= 2) {
            //根据polygon建立边数组,每条边为相邻两个点的连线
            for (let i = 0; i < polys.length - 1; i++) {
              const start = polys[i];
              const end = polys[i + 1];
              const edge = {
                x1: start.x + object.x,
                y1: start.y + object.y,
                x2: end.x + object.x,
                y2: end.y + object.y,
                id: id,
                useable: true,
                onlyVisition:
                  onlyVisitionProp && onlyVisitionProp.value === "true"
                    ? true
                    : false,
                onlyBlock:
                  onlyBlockProp && onlyBlockProp.value === "true"
                    ? true
                    : false,
              };
              edges.push(edge);
            }
            // 处理最后一个点与第一个点的连线
            if (
              type === "polygon" &&
              object.polygon &&
              object.polygon.length > 0
            ) {
              const start = polys[object.polygon.length - 1];
              const end = polys[0];
              edges.push({
                x1: start.x + object.x,
                y1: start.y + object.y,
                x2: end.x + object.x,
                y2: end.y + object.y,
                id: id,
                useable: true,
                onlyVisition:
                  onlyVisitionProp && onlyVisitionProp.value === "true"
                    ? true
                    : false,
                onlyBlock:
                  onlyBlockProp && onlyBlockProp.value === "true"
                    ? true
                    : false,
              });
            }
          }
        });
      } else {
        console.error("No passable objects found in the map.");
      }
    });
    console.log("init edges", edges);
    this.edges = edges;
  }
}
