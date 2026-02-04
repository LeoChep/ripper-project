import { Container, Sprite, Assets, Text, TextStyle, Graphics } from "pixi.js";
import type { Door } from "../units/Door";
import { getDoorSvg } from "@/utils/utils";
import { useTalkStateStore } from "@/stores/talkStateStore";
import { golbalSetting } from "../golbalSetting";
import * as InitiativeSystem from "@/core/system/InitiativeSystem";
import { CharacterCombatController } from "../controller/CharacterCombatController";
import { CharacterOutCombatController } from "../controller/CharacterOutCombatController";
import { CharacterController } from "../controller/CharacterController";
import { FogSystem } from "../system/FogSystem_unuse";
export class DoorAnimSprite extends Container {
  // 门的状态，true 表示打开，false 表示关闭
  private _isOpen: boolean = false;

  // 门的链接ID
  private _linkedId: number;

  public owner: Door;

  public closedDoor: Sprite | null = null;

  public openedDoor: Sprite | null = null;

  // 添加提示容器和文本
  private tooltipContainer: Container | null = null;
  private tooltip: Text | null = null;
  private tooltipBg: Graphics | null = null;

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

    // 创建提示文本
    this.createTooltip();

    this.onRender = () => {
      this.update(this.callback);
    };
  }

  private createTooltip() {
    // 创建像素风格文本样式
    const style = new TextStyle({
      // fontFamily: "monospace", // 使用等宽字体模拟像素字体
      fontSize: 13,
      fill: 0xffeb3b, // 金黄色文字，符合奇幻风格
      stroke: 0x8b4513, // 棕色描边
      // dropShadow: true,
    });

    // 创建提示容器
    this.tooltipContainer = new Container();
    this.tooltipContainer.visible = false;
    this.tooltipContainer.zIndex = 1000;

    // 创建背景图形
    this.tooltipBg = new Graphics();

    // 创建文本
    this.tooltip = new Text("", style);

    // 添加到容器
    this.tooltipContainer.addChild(this.tooltipBg);
    this.tooltipContainer.addChild(this.tooltip);
    this.addChild(this.tooltipContainer);
  }

  private drawTooltipBackground(width: number, height: number) {
    if (!this.tooltipBg) return;

    this.tooltipBg.clear();

    // 像素风格的边框设计
    const padding = 6;
    const borderWidth = 2;

    // 外边框 - 深棕色
    this.tooltipBg.lineStyle(borderWidth, 0x4a2c17);
    this.tooltipBg.beginFill(0x1a1a1a, 0.9); // 半透明黑色背景
    this.tooltipBg.drawRect(0, 0, width + padding * 2, height + padding * 2);
    this.tooltipBg.endFill();

    // 内边框 - 金色
    this.tooltipBg.lineStyle(1, 0xffd700);
    this.tooltipBg.beginFill(0x2d1810, 0.95); // 深棕色内背景
    this.tooltipBg.drawRect(
      borderWidth,
      borderWidth,
      width + padding * 2 - borderWidth * 2,
      height + padding * 2 - borderWidth * 2
    );
    this.tooltipBg.endFill();

    // 添加装饰性的像素点（模拟古老羊皮纸效果）
    this.tooltipBg.beginFill(0xffd700, 0.3);
    // 左上角装饰
    this.tooltipBg.drawRect(2, 2, 1, 1);
    this.tooltipBg.drawRect(4, 3, 1, 1);
    // 右上角装饰
    this.tooltipBg.drawRect(width + padding * 2 - 4, 2, 1, 1);
    this.tooltipBg.drawRect(width + padding * 2 - 6, 3, 1, 1);
    // 左下角装饰
    this.tooltipBg.drawRect(2, height + padding * 2 - 4, 1, 1);
    this.tooltipBg.drawRect(4, height + padding * 2 - 5, 1, 1);
    // 右下角装饰
    this.tooltipBg.drawRect(
      width + padding * 2 - 4,
      height + padding * 2 - 4,
      1,
      1
    );
    this.tooltipBg.drawRect(
      width + padding * 2 - 6,
      height + padding * 2 - 5,
      1,
      1
    );
    this.tooltipBg.endFill();
  }

  private updateTooltipText() {
    if (this.tooltip) {
      // 使用更有奇幻风格的文本
      this.tooltip.text = this.isOpen ? "✧ 关门 ✧" : "✧ 开门 ✧";
      if (InitiativeSystem.isInBattle()) {
        const checkResult = inBattleAction(this.owner);
        if (checkResult.useful) {
          this.tooltip.text += "(次要动作)";
        } else {
          this.tooltip.text += checkResult.info;
        }
      } else {
        const checkResult = outBattleAction(this.owner);
        if (checkResult) {
          this.tooltip.text += checkResult.info;
        }
      }

      // 重新绘制背景以适应文本大小
      const textBounds = this.tooltip.getBounds();
      this.drawTooltipBackground(textBounds.width, textBounds.height);

      // 居中文本
      this.tooltip.x = 6; // padding
      this.tooltip.y = 6; // padding
    }
  }

  private showTooltip(event: any) {
    if (this.tooltipContainer) {
      this.updateTooltipText();
      this.tooltipContainer.visible = true;

      // 将提示框定位到鼠标位置附近，但避免超出屏幕
      const globalPos = event.data.global;
      let x = globalPos.x - this.x + 15;
      let y = globalPos.y - this.y - 40;

      // 简单的边界检查
      if (x + this.tooltipContainer.width > 800) {
        // 假设屏幕宽度
        x = globalPos.x - this.x - this.tooltipContainer.width - 15;
      }
      if (y < 0) {
        y = globalPos.y - this.y + 25;
      }

      this.tooltipContainer.x = x;
      this.tooltipContainer.y = y;
    }
  }

  private hideTooltip() {
    if (this.tooltipContainer) {
      this.tooltipContainer.visible = false;
    }
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
    this.updateTooltipText();
  }

  public hookPointEvent() {
    const doorAnimSprite = this;
    // 添加鼠标悬停事件
    doorAnimSprite.on("pointerover", (event) => {
      doorAnimSprite.showTooltip(event);
    });

    doorAnimSprite.on("pointerout", () => {
      doorAnimSprite.hideTooltip();
    });

    doorAnimSprite.on("pointermove", (event) => {
      if (doorAnimSprite.tooltipContainer?.visible) {
        let x = 40;
        let y = 20;
        doorAnimSprite.tooltipContainer.x = x;
        doorAnimSprite.tooltipContainer.y = y;
      }
    });
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
  doorAnimSprite.cursor = "pointer";
  doorAnimSprite.hookPointEvent();
  doorAnimSprite.on("pointerdown", () => {
    const talkStore = useTalkStateStore();
    if (talkStore.talkState.onCg) {
      return;
    }
    if (InitiativeSystem.isInBattle()) {
      if (inBattleAction(door).useful == false) {
        return;
      } else {
        const selectedCharacter =
          CharacterCombatController.getInstance().selectedCharacter;
        if (selectedCharacter) {
          InitiativeSystem.useMinorAction(selectedCharacter);
        }
      }
    } else {
      const outBattleResult = outBattleAction(door);
      if (!outBattleResult || !outBattleResult.useful) {
        return;
      }
    }
    console.log("门被点击了，切换状态");
    doorAnimSprite.isOpen = !doorAnimSprite.isOpen;
    doorAnimSprite.owner.isOpen = doorAnimSprite.isOpen;
    const wall = golbalSetting.map?.edges.find((edge) => {
      return edge.id === doorAnimSprite.linkedId;
    });
    if (!wall) {
      console.warn("未找到对应的墙体，无法更新墙体状态");
      return;
    }
    wall.useable = !doorAnimSprite.isOpen;
    FogSystem.instanse.refreshSpatialGrid();
    console.log("门状态切换为:", doorAnimSprite);
  });
  return doorAnimSprite;
};
const outBattleAction = (door: Door) => {
  const map = golbalSetting.map;
  if (!map) {
    return;
  }
  const selectedCharacter = map.sprites.find(
    (sprite) => sprite.id === CharacterController.curser
  );
  if (!selectedCharacter) return { info: "未选择角色", useful: false };
  const doorX = door.x;
  const doorY = door.y;
  const unitX = selectedCharacter.x;
  const unitY = selectedCharacter.y;
  const dis = Math.max(Math.abs(doorX - unitX), Math.abs(doorY - unitY));
  if (dis > 64) {
    return { info: "距离过远", useful: false };
  }
  return { info: "动作可用", useful: true };
};
const inBattleAction = (door: Door) => {
  const selectedCharacter =
    CharacterCombatController.getInstance().selectedCharacter;
  if (!selectedCharacter) return { info: "未选择角色", useful: false };
  let actionUseful = false;
  const doorX = door.x;
  const doorY = door.y;
  const unitX = selectedCharacter.x;
  const unitY = selectedCharacter.y;
  const dis = Math.max(Math.abs(doorX - unitX), Math.abs(doorY - unitY));
  if (dis > 64) {
    return { info: "距离过远", useful: false };
  }

  actionUseful = InitiativeSystem.checkActionUseful(selectedCharacter, "minor");

  if (!actionUseful && selectedCharacter)
    return { info: "动作不足", useful: false };
  return { info: "动作可用", useful: true };
};
