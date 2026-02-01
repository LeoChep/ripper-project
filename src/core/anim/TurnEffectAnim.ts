import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import { EnemyTurnUnitAnimSprite } from "./EnemyTurnUnitAnimSprite";
import { FriendlyTurnUnitAnimSprite } from "./FriendlyTurnUnitAnimSprite";
import { SelectAnimSprite } from "./SelectAnimSprite";
import { zIndexSetting } from "../envSetting";
import { golbalSetting } from "../golbalSetting";

/**
 * 回合效果动画控制器
 * 负责管理回合时的视觉效果（敌方红色边框、友军绿色边框、我方选中箭头）
 */
export class TurnEffectAnim {
  /**
   * 显示友军回合效果（绿色友好边框）
   * @param unit 要显示效果的单位
   */
  static showFriendlyEffect(unit: Unit) {
    if (!this.validateUnit(unit)) return;

    const effectContainer = this.getOrCreateEffectContainer(unit.animUnit!);

    // 检查是否已经存在 friendlyTurn 效果
    const existingEffect = this.findEffect<FriendlyTurnUnitAnimSprite>(
      effectContainer,
      "friendlyTurn"
    );

    if (existingEffect) {
      existingEffect.activate();
      return;
    }

    // 获取单位的实际尺寸
    const size = unit.animUnit!.visisualSizeValue;
    const friendlyTurnSprite = new FriendlyTurnUnitAnimSprite(size.width, size.height);
    friendlyTurnSprite.label = "friendlyTurn";
    friendlyTurnSprite.activate();

    this.attachEffect(effectContainer, friendlyTurnSprite);
  }

  /**
   * 移除友军回合效果
   * @param unit 要移除效果的单位
   */
  static removeFriendlyEffect(unit: Unit) {
    this.removeEffect(unit, "friendlyTurn", (sprite) => {
      (sprite as FriendlyTurnUnitAnimSprite).deactivate();
    });
  }

  /**
   * 显示敌方回合效果（红色警示边框）
   * @param unit 要显示效果的单位
   */
  static showEnemyEffect(unit: Unit) {
    if (!this.validateUnit(unit)) return;

    const effectContainer = this.getOrCreateEffectContainer(unit.animUnit!);

    // 检查是否已经存在 enemyTurn 效果
    const existingEffect = this.findEffect<EnemyTurnUnitAnimSprite>(
      effectContainer,
      "enemyTurn"
    );

    if (existingEffect) {
      existingEffect.activate();
      return;
    }

    // 获取单位的实际尺寸
    const size = unit.animUnit!.visisualSizeValue;
    const enemyTurnSprite = new EnemyTurnUnitAnimSprite(size.width, size.height);
    enemyTurnSprite.label = "enemyTurn";
    enemyTurnSprite.activate();

    this.attachEffect(effectContainer, enemyTurnSprite);
  }

  /**
   * 移除敌方回合效果
   * @param unit 要移除效果的单位
   */
  static removeEnemyEffect(unit: Unit) {
    this.removeEffect(unit, "enemyTurn", (sprite) => {
      (sprite as EnemyTurnUnitAnimSprite).deactivate();
    });
  }

  /**
   * 显示我方回合效果（选中箭头动画）
   * @param unit 要显示效果的单位
   */
  static showPlayerEffect(unit: Unit) {
    if (!this.validateUnit(unit)) return;

    const effectContainer = this.getOrCreateEffectContainer(unit.animUnit!);

    // 获取单位的实际尺寸
    const size = unit.animUnit!.visisualSizeValue;
    const arrowSprite = new SelectAnimSprite(size.width, size.height);
    arrowSprite.label = "arrow";
    arrowSprite.select();

    this.attachEffect(effectContainer, arrowSprite);
    unit.animUnit?.update(0)
  }

  /**
   * 移除我方回合效果（选中箭头）
   * @param unit 要移除效果的单位
   */
  static removePlayerEffect(unit: Unit) {
    this.removeEffect(unit, "arrow");
  }

  // ============ 私有辅助方法 ============

  /**
   * 验证单位是否有效
   */
  private static validateUnit(unit: Unit): boolean {
    if (!unit?.animUnit) {
      console.warn("单位或单位动画精灵不存在");
      return false;
    }
    return true;
  }

  /**
   * 获取或创建效果容器
   */
  private static getOrCreateEffectContainer(
    animUnit: PIXI.Container
  ): PIXI.Container {
    let effectContainer = animUnit.children.find(
      (child) => child.label === "effect"
    ) as PIXI.Container | undefined;

    if (!effectContainer) {
      effectContainer = new PIXI.Container();
      effectContainer.label = "effect";
      animUnit.addChild(effectContainer);
    }

    return effectContainer;
  }

  /**
   * 查找指定标签的效果
   */
  private static findEffect<T extends PIXI.Container>(
    container: PIXI.Container,
    label: string
  ): T | undefined {
    return container.children.find((child) => child.label === label) as
      | T
      | undefined;
  }

  /**
   * 附加效果到容器并设置更新
   */
  private static attachEffect(
    container: PIXI.Container,
    sprite: PIXI.Container & { update: (delta: number) => void }
  ) {
    container.addChild(sprite);
    sprite.zIndex = zIndexSetting.spriteZIndex;

    // const lineLayer = golbalSetting.rlayers.lineLayer;
    // lineLayer?.attach(sprite);

    this.addTickerUpdate(sprite);
    
  }

  /**
   * 添加 ticker 更新函数
   */
  private static addTickerUpdate(
    sprite: PIXI.Container & { update: (delta: number) => void }
  ) {
    if (golbalSetting.app) {
      const updateFn = (ticker: any) => {
        sprite.update(ticker.deltaTime);
      };
      golbalSetting.app.ticker.add(updateFn);
      (sprite as any)._tickerFn = updateFn;
    }
 
  }

  /**
   * 移除效果
   * @param unit 单位
   * @param label 效果标签
   * @param beforeRemove 移除前的回调（可选）
   */
  private static removeEffect(
    unit: Unit,
    label: string,
    beforeRemove?: (sprite: PIXI.Container) => void
  ) {
    if (!unit?.animUnit) {
      console.warn(`单位动画精灵不存在，无法移除 ${label} 效果`);
      return;
    }

    const effectContainer = this.findEffect<PIXI.Container>(
      unit.animUnit,
      "effect"
    );
    if (!effectContainer) return;

    const effectSprite = this.findEffect<PIXI.Container>(
      effectContainer,
      label
    );
    if (!effectSprite) return;

    beforeRemove?.(effectSprite);

    // 移除 ticker 更新函数
    if (golbalSetting.app && (effectSprite as any)._tickerFn) {
      golbalSetting.app.ticker.remove((effectSprite as any)._tickerFn);
    }

    effectContainer.removeChild(effectSprite);
    effectSprite.destroy();
  }
}
