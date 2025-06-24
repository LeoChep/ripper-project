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
  constructor(data: any) {
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
  }
}