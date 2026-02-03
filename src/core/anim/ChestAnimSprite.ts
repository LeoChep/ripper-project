import { Container, Sprite, Assets, Text, TextStyle, Graphics } from "pixi.js";
import * as PIXI from "pixi.js";
import type { Chest } from "../units/Chest";
import { useTalkStateStore } from "@/stores/talkStateStore";
import { golbalSetting } from "../golbalSetting";
import * as InitiativeSystem from "@/core/system/InitiativeSystem";
import { CharacterCombatController } from "../controller/CharacterCombatController";
import { CharacterOutCombatController } from "../controller/CharacterOutCombatController";
import { CharacterController } from "../controller/CharacterController";
import { MessageTipSystem } from "../system/MessageTipSystem";

export class ChestAnimSprite extends Container {
  // 宝箱的状态，true 表示打开，false 表示关闭
  private _isOpen: boolean = false;

  public owner: Chest;

  public closedChest: Sprite | null = null;

  public openedChest: Sprite | null = null;

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

  constructor(chest: Chest) {
    super();
    this.owner = chest;

    // 创建提示文本
    this.createTooltip();

    this.onRender = () => {
      this.update(this.callback);
    };
  }

  private createTooltip() {
    // 创建像素风格文本样式
    const style = new TextStyle({
      fontSize: 13,
      fill: 0xffeb3b, // 金黄色文字
      stroke: 0x8b4513, // 棕色描边
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

    const padding = 6;
    const borderWidth = 2;

    // 外边框 - 深棕色
    this.tooltipBg.lineStyle(borderWidth, 0x4a2c17);
    this.tooltipBg.beginFill(0x1a1a1a, 0.9);
    this.tooltipBg.drawRect(0, 0, width + padding * 2, height + padding * 2);
    this.tooltipBg.endFill();

    // 内边框 - 金色
    this.tooltipBg.lineStyle(1, 0xffd700);
    this.tooltipBg.beginFill(0x2d1810, 0.95);
    this.tooltipBg.drawRect(
      borderWidth,
      borderWidth,
      width + padding * 2 - borderWidth * 2,
      height + padding * 2 - borderWidth * 2,
    );
    this.tooltipBg.endFill();
  }

  private updateTooltipText() {
    if (this.tooltip) {
      // 根据宝箱状态显示不同的文本
      this.tooltip.text = this._isOpen ? "✧ 已打开的宝箱 ✧" : "✧ 打开宝箱 ✧";

      // 如果宝箱未打开，检查动作和距离
      if (!this._isOpen) {
        if (InitiativeSystem.isInBattle()) {
          const checkResult = inBattleChestAction(this.owner);
          if (checkResult.useful) {
            this.tooltip.text += "(次要动作)";
          } else {
            this.tooltip.text += `(${checkResult.info})`;
          }
        } else {
          const checkResult = outBattleChestAction(this.owner);
          if (checkResult && !checkResult.useful) {
            this.tooltip.text += `(${checkResult.info})`;
          }
        }
      }

      // 重新绘制背景以适应文本大小
      const textBounds = this.tooltip.getBounds();
      this.drawTooltipBackground(textBounds.width, textBounds.height);

      // 调整文本位置
      this.tooltip.x = 6; // padding
      this.tooltip.y = 6; // padding
    }
  }

  private showTooltip() {
    if (!this.tooltipContainer || !this.tooltip || !this.tooltipBg) return;

    this.updateTooltipText();

    const padding = 6;

    // 将提示词放置在宝箱正上方
    const tooltipHeight = this.tooltip.height + padding * 2;
    const tooltipWidth = this.tooltip.width + padding * 2;
    this.tooltipContainer.position.set(
      (64 - tooltipWidth) / 2, // 水平居中
      -tooltipHeight - 5, // 在宝箱上方，留 5 像素间距
    );

    this.tooltipContainer.visible = true;
  }

  private hideTooltip() {
    if (this.tooltipContainer) {
      this.tooltipContainer.visible = false;
    }
  }

  public hookPointEvent() {
    this.on("pointerenter", () => {
      this.showTooltip();
    });

    this.on("pointerleave", () => {
      this.hideTooltip();
    });
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public set isOpen(value: boolean) {
    this._isOpen = value;
    this.updateAppearance();
  }

  private updateAppearance() {
    if (this.closedChest && this.openedChest) {
      this.closedChest.visible = !this._isOpen;
      this.openedChest.visible = this._isOpen;
    }
  }

  public update(callback: any) {
    if (callback) {
      callback();
    }
  }
}

// 非战斗状态下的宝箱动作检定
const outBattleChestAction = (chest: Chest) => {
  const map = golbalSetting.map;
  if (!map) {
    return { info: "地图未加载", useful: false };
  }
  const selectedCharacter = map.sprites.find(
    (sprite) => sprite.id === CharacterController.curser,
  );
  if (!selectedCharacter) {
    return { info: "未选择角色", useful: false };
  }

  const chestX = chest.x + 32; // 宝箱中心点（考虑偏移）
  const chestY = chest.y + 32;
  const unitX = selectedCharacter.x + 32;
  const unitY = selectedCharacter.y + 32;
  const dis = Math.max(Math.abs(chestX - unitX), Math.abs(chestY - unitY));

  if (dis > 64) {
    return { info: "距离过远", useful: false };
  }
  return { info: "动作可用", useful: true };
};

// 战斗状态下的宝箱动作检定
const inBattleChestAction = (chest: Chest) => {
  const selectedCharacter =
    CharacterCombatController.getInstance().selectedCharacter;
  if (!selectedCharacter) {
    return { info: "未选择角色", useful: false };
  }

  let actionUseful = false;
  const chestX = chest.x + 32; // 宝箱中心点（考虑偏移）
  const chestY = chest.y + 32;
  const unitX = selectedCharacter.x + 32;
  const unitY = selectedCharacter.y + 32;
  const dis = Math.max(Math.abs(chestX - unitX), Math.abs(chestY - unitY));

  if (dis > 64) {
    return { info: "距离过远", useful: false };
  }

  actionUseful = InitiativeSystem.checkActionUseful(selectedCharacter, "minor");

  if (!actionUseful && selectedCharacter) {
    return { info: "动作不足", useful: false };
  }
  return { info: "动作可用", useful: true };
};

/**
 * 从宝箱对象创建宝箱动画精灵
 */
export const createChestAnimSpriteFromChest = async (chest: Chest) => {
  // 使用 box1.png 图集（根据 A.tmj 中的配置）
  console.log("Loading chest textures...");
  const boxTextureUrl = new URL("@/assets/map/box1.png", import.meta.url).href;

  const boxTexture = await Assets.load(boxTextureUrl);
  console.log("Chest texture loaded:", boxTextureUrl);
  // box1.png 是 4 帧的图集，每帧 64x64，间距 10
  // 第 0 帧是关闭状态，第 3 帧是打开状态
  const frameWidth = 64;
  const frameHeight = 64;
  const spacing = 10;

  // 创建关闭状态的纹理（第 0 帧）
  const closedTexture = new PIXI.Texture({
    source: boxTexture.source,
    frame: new PIXI.Rectangle(0, 0, frameWidth, frameHeight),
  });
  const closedChestSprite = new Sprite(closedTexture);
  closedChestSprite.anchor.set(0, 0); // 设置锚点为左上角，与 unit 一致

  // 设置宝箱尺寸为 50x50
  const targetSize = 50;
  const scale = targetSize / frameWidth;
  closedChestSprite.scale.set(scale, scale);

  // 创建打开状态的纹理（目前没有图形资源，所以也用同一帧代替）
  //
  console.log("Creating opened chest texture...");
  const openedTexture = new PIXI.Texture({
    source: boxTexture.source,
    frame: new PIXI.Rectangle(
      (frameWidth + spacing) * 0,
      0,
      frameWidth,
      frameHeight,
    ),
  });
  const openedChestSprite = new Sprite(openedTexture);
  openedChestSprite.anchor.set(0, 0); // 设置锚点为左上角，与 unit 一致
  openedChestSprite.scale.set(scale, scale); // 同样设置为 50x50

  const chestAnimSprite = new ChestAnimSprite(chest);
  chestAnimSprite.closedChest = closedChestSprite;
  chestAnimSprite.openedChest = openedChestSprite;

  chestAnimSprite.addChild(closedChestSprite);
  chestAnimSprite.addChild(openedChestSprite);

  // 参考 unit 的位置设置：对齐到网格，居中显示（64格子中居中50像素的宝箱）
  const offset = (64 - targetSize) / 2;
  chestAnimSprite.x = Math.round(chest.x / 64) * 64 + offset;
  chestAnimSprite.y = Math.round(chest.y / 64) * 64 + offset;

  chestAnimSprite.isOpen = chest.isOpen;
  chestAnimSprite.zIndex = 20;
  closedChestSprite.zIndex = 20;
  openedChestSprite.zIndex = 20;

  chestAnimSprite.eventMode = "static";
  chestAnimSprite.cursor = "pointer";
  chestAnimSprite.hookPointEvent();
  console.log("Hooked point event for chest:", chest.id);

  // 添加点击事件
  chestAnimSprite.on("pointerdown", () => {
    const talkStore = useTalkStateStore();
    if (talkStore.talkState.onCg) {
      return;
    }

    // if (chestAnimSprite.isOpen) {
    //   MessageTipSystem.getInstance().setMessageQuickly("这个宝箱已经被打开了");
    //   return;
    // }

    // 战斗中和非战斗状态的距离和动作检定
    if (InitiativeSystem.isInBattle()) {
      if (inBattleChestAction(chest).useful == false) {
        return;
      } else {
        const selectedCharacter =
          CharacterCombatController.getInstance().selectedCharacter;
        if (selectedCharacter) {
          InitiativeSystem.useMinorAction(selectedCharacter);
        }
      }
    } else {
      const outBattleResult = outBattleChestAction(chest);
      if (!outBattleResult || !outBattleResult.useful) {
        return;
      }
    }

    // 打开宝箱

    // 获取宝箱内容
    chest.open();
    chestAnimSprite.isOpen = true;
    const contents = chest.contents;
    // 调用全局对话框显示宝箱内容
    if (typeof window !== "undefined" && (window as any).openChestLootDialog) {
      console.log("Opening chest loot dialog with contents:", contents);
      (window as any).openChestLootDialog(contents, chest.id);
    } else {
      // 降级处理：如果对话框不可用，显示消息
      if (contents.length > 0) {
        MessageTipSystem.getInstance().setMessageQuickly(
          `你打开了宝箱，获得了: ${contents.map((item: any) => item.name || item).join(", ")}`,
        );
      } else {
        MessageTipSystem.getInstance().setMessageQuickly("宝箱是空的");
      }
    }

    // console.log("Chest opened:", chest.id, "Contents:", contents);
  });
  console.log("Created chest anim sprite:", chest.id, "at", chest.x, chest.y);
  chest.chestSprite = chestAnimSprite;
  return chestAnimSprite;
};
