export interface TiledMapLayer {
  compression?: string;
  data?: string;
  encoding?: string;
  height?: number;
  id: number;
  name: string;
  opacity: number;
  type: string;
  visible: boolean;
  width?: number;
  x: number;
  y: number;
  // objectgroup
  class?: string;
  draworder?: string;
  objects?: Array<{
    height: number;
    id: number;
    name: string;
    rotation: number;
    type: string;
    visible: boolean;
    width: number;
    x: number;
    y: number;
  }>;
}

export interface TiledMapTileset {
  firstgid: number;
  source: string;
}

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