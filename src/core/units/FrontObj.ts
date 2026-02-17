import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";

export class FrontObj {
  
  public frontObjSprite: PIXI.Sprite | null;
  public id: number;
  public x: number;
  public y: number;
  public frontObjName: string;
  constructor(id: number, x: number, y: number, frontObjName: string) {
    this.id = id;
    this.frontObjSprite = null;
    this.x = x;
    this.y = y;
    this.frontObjName = frontObjName; 
  

    // this.doorSprite.on('pointerdown', this.toggle.bind(this));
  }

  
}
export function createFrontObjFromObj(obj: any): FrontObj {
  const x = obj.x;
  const y = obj.y;
  const frontObjName = obj.name;
 
  const frontObj = new FrontObj(obj.id, x, y, frontObjName );

    const frontObjNameProp = obj.properties?.find(
            (p: any) => p.name === "frontObjName",
          );
    if (frontObjNameProp) {
      frontObj.frontObjName = frontObjNameProp.value;
    }

  
  return frontObj;
}
