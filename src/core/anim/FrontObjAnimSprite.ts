import { getMapAssetFile, getMapFrontObjIMG } from "@/utils/utils";
import { FrontObj } from "./../units/FrontObj";
import { Sprite } from "pixi.js";
import * as PIXI from "pixi.js";
import { FrontObjSystem } from "../system/FrontObjSystem";
export class FrontObjAnimSprite extends Sprite {
  // 宝箱的状态，true 表示打开，false 表示关闭
  private _isOpen: boolean = false;

  public owner: FrontObj;

  // 添加提示容器和文本

  private callback: any;
  public get animationCallback(): any {
    return this.callback;
  }

  public set animationCallback(cb: any) {
    this.callback = cb;
  }

  constructor(frontObj: FrontObj) {
    super();
    this.owner = frontObj;

    // 创建提示文本
    
  }
}

/**
 * 从前景对象创建前景动画精灵
 */
export const createFrontObjAnimSpriteFromFront = async (
  frontObj: FrontObj,
  mapName: string
) => {
  // 使用 box1.png 图集（根据 A.tmj 中的配置）
  console.log("Loading chest textures...");
  const boxTextureUrl = getMapFrontObjIMG(mapName, "frontObj", "png");
  
  const boxTexture = await PIXI.Assets.load(boxTextureUrl);
  // box1.png 是 4 帧的图集，每帧 64x64，间距 10
  // 第 0 帧是关闭状态，第 3 帧是打开状态
  console.log("Loaded frontObj :", frontObj);
  const frontObjInfo=FrontObjSystem.getInstance().getFrontObjInfo(mapName, frontObj.frontObjName);
  console.log("Retrieved front object info:", frontObjInfo);
  if (!frontObjInfo) {
    console.error(`未找到前景对象信息: ${frontObj.frontObjName} 在地图 ${mapName}`);
    return null;
  }
  const texture = new PIXI.Texture({
    source: boxTexture.source,
    frame: new PIXI.Rectangle(frontObjInfo.x, frontObjInfo.y, frontObjInfo.width, frontObjInfo.height),
  });
  const frontObjSprite = new Sprite(texture);
 
  frontObjSprite.anchor.set(0, 0); // 设置锚点为左上角，与 unit 一致
  frontObjSprite.x = frontObj.x;
  frontObjSprite.y = frontObj.y ; // 
  frontObjSprite.zIndex=frontObj.y+(frontObjInfo.height-frontObjInfo.occlusionHeight)
  frontObjSprite.eventMode='none'
  return frontObjSprite;
};
