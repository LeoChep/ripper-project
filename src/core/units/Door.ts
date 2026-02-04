import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";

export class Door {
  public linkedId: number;
  public isOpen: boolean = false;
  public doorSprite: PIXI.Container | null;
  public id: number;
  public x: number;
  public y: number;

  constructor(id: number, x: number, y: number, linkId: number) {
    this.id = id;
    this.doorSprite = null;
    this.x = x;
    this.y = y;
    this.linkedId = linkId;
    console.log("Door created at:", x, y, "linkedId:", this.linkedId);

    // this.doorSprite.on('pointerdown', this.toggle.bind(this));
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }
}
export function createDoorFromDoorObj(obj: any): Door {
  const x = obj.x;
  const y = obj.y;
  const linkId = obj.properties?.find((p: any) => p.name === "linkId");
  const linkIdValue = Number.parseInt(linkId?.value);
  const door = new Door(obj.id, x, y, linkIdValue);
  door.isOpen = obj.useable === false ? true : false;
  return door;
}
