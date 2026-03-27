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

  // 应用缩放
  const scale = frontObj.scale ?? 1;
  frontObjSprite.scale.set(scale, scale);

  // 根据锚点调整位置（考虑缩放）
  // frontObj.x 和 frontObj.y 已经是容器位置（在编辑器中已经减去了锚点偏移 * scale）
  // 所以这里只需要直接设置位置
  frontObjSprite.x = frontObj.x;
  frontObjSprite.y = frontObj.y;

  // 计算 zIndex（实现遮挡效果）
  // 使用对象的底部Y坐标加上遮挡高度来计算
  // 需要考虑缩放对高度的影响
  const anchor = frontObj.anchor ?? { x: 0, y: 0 };
  const occlusionHeight = frontObjInfo.occlusionHeight ?? 0;
  const scaledHeight = frontObjInfo.height * scale;
  const scaledOcclusionHeight = occlusionHeight * scale;
  console.log('scaledOcclusionHeight',scaledOcclusionHeight)
  console.log('anchor.y',anchor.y)
  const baseY = frontObj.y-(frontObjInfo.height-anchor.y)*scale ; // 锚点的Y坐标（考虑缩放）
  frontObjSprite.zIndex = baseY + (scaledHeight - scaledOcclusionHeight);
  console.log('Zindex-测试',frontObjSprite.zIndex)
  frontObjSprite.eventMode='none'
  console.log('frontObjSprite',frontObjSprite, 'scale:', scale, 'anchor:', anchor);
  return frontObjSprite;
};
