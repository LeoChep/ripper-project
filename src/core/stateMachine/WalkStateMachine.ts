import type { Unit } from "../units/Unit";
import { StateMachine } from "./StateMachine";
const tileSize = 64; // 假设每个格子的大小为64像素
export class WalkStateMachine extends StateMachine {
  public currentState: string | null = null;
  private path: {
    x: number;
    y: number;
  }[] = [];
  private targetX: number = 0;
  private targetY: number = 0;
  public callBack = () => {};
  constructor(unit: Unit) {
    super(unit);
  }
  public setTarget(targetX: number, targetY: number): void {
    this.targetX = targetX;
    this.targetY = targetY;
  }
  public setPath(path: { x: number; y: number }[]): void {
    this.path = path;
  }
  public setState(state: string): void {
    this.currentState = state;
  }

  public getState(): string | null {
    return this.currentState;
  }

  public doAction() {
    if (this.path.length === 0) {
      console.warn("没有路径可供移动");
      this.callBack(); // 调用回调函数
      this.callBack = () => {};
      return;
    }
    const nextPathPoint = this.path[0];
    const nextX = nextPathPoint.x * tileSize;
    const nextY = nextPathPoint.y * tileSize;
    console.log("nextpoint", nextPathPoint);
    const unit = this.owner;
    const spriteUnit = this.owner.animUnit;
    if (!spriteUnit) {
      console.error("动画精灵不存在");
      return;
    }
    spriteUnit.state = "walk";
    const dx = nextX - spriteUnit.x;
    const dy = nextY - spriteUnit.y;
    //转向
    let direction = unit.direction;
    //设置朝向
    if (Math.abs(dx) < 7 && Math.abs(dy) < 7) {
      // 如果没有移动，直接返回
    } else if (Math.abs(dx) >= Math.abs(dy) - 1) {
      // 水平移动
      direction = dx > 0 ? 0 : 1; // 0向右, 1向左
    } else if (Math.abs(dy) > Math.abs(dx)) {
      // 垂直移动
      direction = dy > 0 ? 2 : 3; // 2向下, 3向上
    } else if (dx == 0 && dy == 0) {
      // 如果没有移动，直接返回
    }

    unit.direction = direction;
    this.movefunc(unit, nextX, nextY, this.path);
  }

  movefunc(
    unit: Unit,
    nextX: number,
    nextY: number,
    path: { x: number; y: number }[]
  ) {
    const spriteUnit = unit.animUnit;
    if (!spriteUnit) {
      console.error("动画精灵不存在");
      return;
    }
    if (spriteUnit.x !== nextX || spriteUnit.y !== nextY) {
      const dx = nextX - spriteUnit.x;
      const dy = nextY - spriteUnit.y;

      // 计算移动步长
      const distance = Math.sqrt(dx * dx + dy * dy);
      const step = 7.68;
      const stepX =
        distance === 0 ? 0 : (dx / distance) * Math.min(step, Math.abs(dx));
      const stepY =
        distance === 0 ? 0 : (dy / distance) * Math.min(step, Math.abs(dy));
      // 更新动画精灵的位置
      spriteUnit.x += stepX;
      spriteUnit.y += stepY;
      console.log(
        `移动到位置: (${spriteUnit.x}, ${spriteUnit.y})，目标位置`,
        `(${nextX}, ${nextY})，步长: (${stepX}, ${stepY})，距离 ： ${distance}`
      );
      // 如果接近目标位置，则直接设置到目标位置
      if (
        Math.abs(spriteUnit.x - nextX) < 1 &&
        Math.abs(spriteUnit.y - nextY) < 1
      ) {
        spriteUnit.x = nextX;
        spriteUnit.y = nextY;
      }
      unit.x = spriteUnit.x;
      unit.y = spriteUnit.y;
    }
    if (
      Math.abs(spriteUnit.x - nextX) < 1 &&
      Math.abs(spriteUnit.y - nextY) < 1
    ) {
      spriteUnit.x = nextX;
      spriteUnit.y = nextY;
      // 移除已到达的路径点
      console.log("到达目标点", nextX, nextY);
      this.path.shift();
      const unitX = Math.floor(this.owner.x / tileSize);
      const unitY = Math.floor(this.owner.y / tileSize);
      if (unitX === this.targetX && unitY === this.targetY) {
        console.log("到达目标位置，停止移动");
        this.path = []; // 清空路径
        this.owner.state = "idle"; // 设置单位状态为闲置
        this.callBack(); // 调用回调函数
        this.callBack = () => {};
      }
    }
  }
}
