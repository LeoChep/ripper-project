import { Container, Sprite, Assets } from "pixi.js";
import type { Door } from "../units/Door";
import { getDoorSvg } from "@/utils/utils";
import { useTalkStateStore } from "@/stores/talkStateStore";

export class DoorAnimSprite extends Container {
  // 门的状态，true 表示打开，false 表示关闭
  private _isOpen: boolean = false;

  // 门的链接ID
  private _linkedId: number;

  public owner: Door;

  public closedDoor: Sprite | null = null;

  public openedDoor: Sprite | null = null;
  private callback: any;
  public get animationCallback(): any {
    return this.callback;
  }

  public set animationCallback(cb: any) {
    this.callback = cb;
  }

  constructor(door: Door) {
    super();
    this.owner = door;
    this._linkedId = door.linkedId;

    this.onRender = () => {
      this.update(this.callback);
    };
  }
  update(callback: any) {
    if (this.openedDoor) {
      this.openedDoor.renderable = false;
    }
    if (this.closedDoor) {
      this.closedDoor.renderable = false;
    }
    if (this.isOpen && this.openedDoor) {
      this.openedDoor.renderable = true;
    }
    if (!this.isOpen && this.closedDoor) {
      this.closedDoor.renderable = true;
    }
  }

  // 获取门的链接ID
  public get linkedId(): number {
    return this._linkedId;
  }

  // 获取门的状态
  public get isOpen(): boolean {
    return this._isOpen;
  }

  // 设置门的状态
  public set isOpen(value: boolean) {
    this._isOpen = value;
  }
}

export const createDoorAnimSpriteFromDoor = async (door: Door) => {
  const closedUrl = getDoorSvg("closed");
  const closedDoorTexture = await Assets.load(closedUrl);
  const closedDoorSprite = new Sprite(closedDoorTexture);
  const openedUrl = getDoorSvg("open");
  const openedDoorTexture = await Assets.load(openedUrl);
  const openedDoorSprite = new Sprite(openedDoorTexture);
  const doorAnimSprite = new DoorAnimSprite(door);
  doorAnimSprite.closedDoor = closedDoorSprite;
  doorAnimSprite.openedDoor = openedDoorSprite;
  doorAnimSprite.addChild(closedDoorSprite);
  doorAnimSprite.addChild(openedDoorSprite);
  doorAnimSprite.x = door.x - 16;
  doorAnimSprite.y = door.y - 16;
  closedDoorSprite.scale.set(0.08, 0.08);
  openedDoorSprite.scale.set(0.08, 0.08);
  doorAnimSprite.isOpen = door.isOpen;
  doorAnimSprite.zIndex = 20;
  closedDoorSprite.zIndex = 20;
  doorAnimSprite.eventMode = "static";
  doorAnimSprite.on("pointerdown", () => {
    const talkStore = useTalkStateStore();
    if (talkStore.talkState.onCg) {
      return;
    }
    console.log("门被点击了，切换状态");
    doorAnimSprite.isOpen = !doorAnimSprite.isOpen;
    doorAnimSprite.owner.isOpen = doorAnimSprite.isOpen;
    doorAnimSprite.owner.wall.useable = !doorAnimSprite.isOpen;
    console.log("门状态切换为:", doorAnimSprite);
 
  });
  return doorAnimSprite;
};
