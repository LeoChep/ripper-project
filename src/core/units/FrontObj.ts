import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";

export class FrontObj {

  public frontObjSprite: PIXI.Sprite | null;
  public id: number;
  public x: number;
  public y: number;
  public frontObjName: string;
  public scale: number; // 添加 scale 属性
  public anchor: { x: number; y: number }; // 添加 anchor 属性

  constructor(id: number, x: number, y: number, frontObjName: string, scale: number = 1, anchor: { x: number; y: number } = { x: 0, y: 0 }) {
    this.id = id;
    this.frontObjSprite = null;
    this.x = x;
    this.y = y;
    this.frontObjName = frontObjName;
    this.scale = scale; // 保存缩放比例
    this.anchor = anchor; // 保存锚点位置


    // this.doorSprite.on('pointerdown', this.toggle.bind(this));
  }


}
export function createFrontObjFromObj(obj: any): FrontObj {
  const x = obj.x;
  const y = obj.y;
  const frontObjName = obj.name;

  // 从 properties 中读取 scale 属性，默认为 1
  const scaleProp = obj.properties?.find((p: any) => p.name === "scale");
  const scale = scaleProp?.value ?? 1;

  // 从 properties 中读取 anchor 属性，默认为 { x: 0, y: 0 }
  const anchorProp = obj.properties?.find((p: any) => p.name === "anchor");
  const anchor = anchorProp?.value ?? { x: 0, y: 0 };

  const frontObj = new FrontObj(obj.id, x, y, frontObjName, scale, anchor);

    const frontObjNameProp = obj.properties?.find(
            (p: any) => p.name === "frontObjName",
          );
    if (frontObjNameProp) {
      frontObj.frontObjName = frontObjNameProp.value;
    }


  return frontObj;
}
