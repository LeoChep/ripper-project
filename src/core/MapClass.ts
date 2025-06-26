import * as PIXI from 'pixi.js';

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
  edges: Array<{ x1: number; y1: number; x2: number; y2: number; }> = [];
  textures?: PIXI.Sprite;
  constructor(data: any,textures: any) {
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
    this.initEdges();
    if (textures) {
     this.textures=new PIXI.Sprite(textures);
    }
  
  }
  initEdges(){
     const layers = this.layers;
    const objectsGroup = layers.find((layer) => layer.type === "objectgroup"&& layer.name==='wall');
    const edges: { x1: number; y1: number; x2: number; y2: number; }[] = [];
    if (objectsGroup && objectsGroup.objects) {
        objectsGroup.objects.forEach((object) => {
            // 检查对象是否有polygon属性
            let polys = null
            let type = null
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
                    const end = polys[(i + 1)];
                    edges.push({
                        x1: start.x + object.x,
                        y1: start.y + object.y,
                        x2: end.x + object.x,
                        y2: end.y + object.y
                    });
                }
                // 处理最后一个点与第一个点的连线
                if (type === "polygon" &&object.polygon && object.polygon.length > 0) {
                    const start = polys[object.polygon.length - 1];
                    const end = polys[0];
                    edges.push({
                        x1: start.x + object.x,
                        y1: start.y + object.y,
                        x2: end.x + object.x,
                        y2: end.y + object.y
                    });
                }


            }
        });
    } else {
        console.error("No passable objects found in the map.");
    }
    this.edges = edges;
  }
}