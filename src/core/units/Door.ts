import * as PIXI from "pixi.js";

export class Door {
  public linkedId: number;
  public isOpen: boolean = false;
  public doorSprite: PIXI.Container | null;
  public wall: any;
  public x: number;
  public y: number;

  constructor(linkedId: number, x: number, y: number, wall: any) {
    this.linkedId = linkedId;
    this.doorSprite = null;
    this.x = x;
    this.y = y;
    this.wall = wall;
    // this.doorSprite.on('pointerdown', this.toggle.bind(this));
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }
}
export function createDoorFromDoorObj(obj: any): Door {
  const x = (obj.x1 + obj.x2) / 2;
  const y = (obj.y1 + obj.y2) / 2;
  return new Door(obj.id, x, y, obj);
}
