import type { CreatureAttack } from "@/core/units/Creature";
import type { Unit } from "../units/Unit";
import { diceRoll } from "../DiceTryer";
import * as PIXI from "pixi.js";
import { TiledMap } from "../MapClass";
import { takeDamage } from "../system/DamageSystem";
import hitURL from "@/assets/effect/Impact_03_Regular_Yellow_400x400.webm";
import missHRL from "@/assets/effect/Miss_02_White_200x200.webm";
import { getContainer, getLayers } from "@/stores/container";

export function playerSelectAttackMovement(
  e: PIXI.FederatedPointerEvent,
  unit: Unit,
  attack: CreatureAttack,
  mapPassiable: TiledMap | null
) {
  e.stopPropagation();
  const pos = e.data.global;
  // 计算点击位置相对于动画精灵的偏移
  const container = getContainer();
  if (!container) {
    console.error("container 不存在");
    return Promise.resolve({});
  }
  const offsetX = pos.x - container.x;
  const offsetY = pos.y - container.y;
  const targetX = Math.floor(offsetX / 64);
  const targetY = Math.floor(offsetY / 64);
  return attackMovement(targetX, targetY, unit, attack, mapPassiable);
}
export async function attackMovement(
  targetX: number,
  targetY: number,
  attacker: Unit,
  attack: CreatureAttack,
  mapPassiable: TiledMap | null
) {
  const unit= attacker;
  unit.state = "attack";
  const spriteUnit = unit.animUnit;
  if (!spriteUnit) {
    console.error("动画精灵不存在");
    return;
  }
  // 获取点击位置
  const container = getContainer()
  if (!container) {
    console.error("container 不存在");
    return;
  }
  const lineLayer = getLayers().lineLayer
  // 检查目标位置是否在地图范围内
  if (mapPassiable && mapPassiable.sprites) {
    const target = mapPassiable.sprites.find((sprite) => {
      const spriteX = Math.floor(sprite.x / 64);
      const spriteY = Math.floor(sprite.y / 64);
      const inrange = spriteX === targetX && spriteY === targetY;
      console.log(
        `检查目标位置: (${spriteX}, ${spriteY}) 是否在攻击范围内: (${targetX}, ${targetY}) - 结果: ${inrange}`
      );
      // 检查
      return inrange;
    });
    // 执行攻击逻辑
    console.log(target);
    // if (target) alert("attack " + target?.name);
    let hitFlag = false;
    let damage = 0;
    if (target) {
      hitFlag = await checkHit(unit, target, attack);
      if (container && lineLayer) {
       await createMissOrHitAnimation(unit, target, hitFlag, container, lineLayer);
      }

      if (hitFlag) {
        damage = await getDamage(unit, target, attack);
        if (container && lineLayer) {
          createDamageAnim(
            damage.toString(),
            unit,
            target,
            hitFlag,
            container,
            lineLayer
          );
        }
      }
    }
    //播放攻击动画
    await playAttackAnim(unit, targetX, targetY);

    //结算
    if (target) {
      if (hitFlag) {
        //  alert("攻击命中!");
        takeDamage(damage, target, container);
      } else {
        // alert("攻击未命中!");
      }
    }
    unit.state = "idle";
  }
}

async function playAttackAnim(unit: Unit, targetX: number, targetY: number) {
  let direction = unit.direction;
  const spriteUnitX = Math.floor(unit.x / 64); // 假设动画
  const spriteUnitY = Math.floor(unit.y / 64); // 假设动画
  const dx = targetX - spriteUnitX;
  const dy = targetY - spriteUnitY;
  //设置朝向
  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 0) {
    // 水平移动
    direction = dx > 0 ? 0 : 1; // 0向右, 1向左
  } else if (Math.abs(dy) > Math.abs(dx)) {
    // 垂直移动
    direction = dy > 0 ? 2 : 3; // 2向下, 3向上
  }
  console.log(
    `单位 ${unit.name} 攻击方向: ${direction}，目标位置: (${targetX}, ${targetY}), dx: ${dx}, dy: ${dy}`
  );
  // 设置动画精灵的新位置
  unit.direction = direction;
  if (unit.animUnit) {
    unit.animUnit.state = "slash";
  }
  const framesEndPromise = new Promise<void>((resolve) => {
    if (unit.animUnit) {
      unit.animUnit.animationCallback = resolve;
    }
  });
  let animEndResolve: (value: void | PromiseLike<void>) => void;
  const animEndPromise = new Promise<void>((resolve) => {
    animEndResolve = resolve;
  });
  framesEndPromise.then(() => {
    if (unit.animUnit) {
      unit.animUnit.anims[unit.animUnit.state]?.stop();
      // unit.animUnit.state = "walk"; // 恢复为行走状态
      setTimeout(() => {
        // 延时一段时间后恢复为行走状态
        if (unit.animUnit && unit.animUnit.anims["walk"]) {
          unit.animUnit.state = "walk"; // 恢复为行走状态
          animEndResolve();
        }
      }, 100); // 延时100毫秒
    }
  });

  return animEndPromise;
}

async function checkHit(unit: Unit, target: any, attack: CreatureAttack) {
  // 检查攻击是否命中
  const attackBonus = attack.attackBonus || 0; // 攻击加值
  const targetAC = target.creature?.ac || 10; // 目标护甲等级，默认10

  const roll = parseInt(await diceRoll("1d20+" + attackBonus));
  console.log(`攻击掷骰: ${roll} vs AC ${targetAC}`);
  if (roll >= targetAC) {
    console.log("攻击命中!");

    return true; // 命中
  } else {
    console.log("攻击未命中!");
    return false; // 未命中
  }
}

async function createMissOrHitAnimation(
  unit: Unit,
  target: { x: number; y: number },
  hitFlag: boolean,
  container: PIXI.Container<PIXI.ContainerChild>,
  lineLayer: PIXI.IRenderLayer
) {
  let texture: PIXI.Texture;
  let video: HTMLVideoElement | null = null;
  
  video = document.createElement("video");
  if (hitFlag) {
    video.src = hitURL;
  } else {
    video.src = missHRL;
  }

  video.loop = false;
  video.autoplay = false;
  video.muted = true;
  await video.play(); // 兼容自动播放策略
  texture = PIXI.Texture.from(video);
  if (video) {
    console.log("重播");
    video.currentTime = 0;
    video.play();
  }
  console.log("texturetexture", texture);
  const sprite = new PIXI.Sprite(texture);
  // 设置 sprite 位置和大小
  if (hitFlag) {
    sprite.x = target.x - 32;
    sprite.y = target.y - 32;
  } else {
    sprite.x = target.x - 32;
    sprite.y = target.y - 90;
  }
  // alert(video.width)
  sprite.scale = (1 / (sprite.width / 64)) * 2;
  // sprite.width=64
  // sprite.height=64
  // alert(sprite.width)
  container.addChild(sprite);
  lineLayer.attach(sprite);
  setTimeout(() => {
    container.removeChild(sprite);
  }, 1000);
}

async function createDamageAnim(
  damage: string,
  unit: Unit,
  target: { x: number; y: number },
  hitFlag: boolean,
  container: PIXI.Container<PIXI.ContainerChild>,
  lineLayer: PIXI.IRenderLayer
) {
  const damageText = new PIXI.Text({
    text: `-${damage}`,
    style: {
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff,
      // align: "center",
    },
  });

  damageText.x = target.x + 32 - damageText.width / 2;
  damageText.y = target.y;

  container.addChild(damageText);
  lineLayer.attach(damageText);

  const duration = 800;
  const startY = damageText.y;
  const endY = startY - 40;
  const startAlpha = 1;
  const endAlpha = 0;

  let startTime: number | null = null;

  function animateDamageText(ts: number) {
    if (startTime === null) startTime = ts;
    const elapsed = ts - startTime;
    const t = Math.min(elapsed / duration, 1.2);

    damageText.y = startY + (endY - startY) * t;
    damageText.alpha = startAlpha + (endAlpha - startAlpha) * t;

    if (t < 1.2) {
      requestAnimationFrame(animateDamageText);
    } else {
      container.removeChild(damageText);
      damageText.destroy();
    }
  }

  requestAnimationFrame(animateDamageText);
}

async function getDamage(unit: Unit, target: any, attack: CreatureAttack) {
  // 检查攻击是否命中
  const attackBonus = attack.attackBonus || 0; // 攻击加值
  const targetAC = target.creature?.ac || 10; // 目标护甲等级，默认10

  const roll = parseInt(await diceRoll(attack.damage));
  console.log(`攻击掷骰: ${roll} vs AC ${targetAC}`);
  return roll;
}
