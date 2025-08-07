import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";

export class Door {
  public linkedId: number;
  public isOpen: boolean = false;
  public doorSprite: PIXI.Container | null;
  public wall: any;
  public x: number;
  public y: number;

  constructor(linkedId: number, x: number, y: number) {
    this.linkedId = linkedId;
    this.doorSprite = null;
    this.x = x;
    this.y = y;
    this.wall = golbalSetting.map?.edges.find((edge) => {
      return edge.id === linkedId;
    });
    console.log("Door created at:", x, y, "linkedId:", linkedId, this.wall);

    // this.doorSprite.on('pointerdown', this.toggle.bind(this));
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }
}
export function createDoorFromDoorObj(obj: any): Door {
  const x = (obj.x1 + obj.x2) / 2;
  const y = (obj.y1 + obj.y2) / 2;
  const door= new Door(obj.id, x, y);
  door.isOpen = obj.useable === false ? true : false;
  return door;
}
