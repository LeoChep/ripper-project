import { BattleEvenetSystem } from "../system/BattleEventSystem";
import { OpportunitySystem } from "../system/OpportunitySystem";
import { UnitSystem } from "../system/UnitSystem";
import type { Unit } from "../units/Unit";
import { StateMachine } from "./StateMachine";
const tileSize = 64; // 假设每个格子的大小为64像素
export class WalkStateMachine extends StateMachine {
  public currentState: string | null = null;
  public walkType: "normal" | "step" = "normal";
  private path: {
    x: number;
    y: number;
  }[] = [];
  private currentGrids: { x: number; y: number }[] = [];
  private oldGrids: { x: number; y: number }[] = [];
  public onDivideWalk: boolean = false; // 是否分割行走
  public leastDivideSpeed: number = 0; //剩余
  private targetX: number = 0;
  private targetY: number = 0;
  private pauseMove: boolean = false;
  private haveOpportunity: number[] = [];
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
    if (this.pauseMove) {
      console.log("移动已暂停");
      return;
    }
    const nextPathPoint = this.path[0];
    const nextX = nextPathPoint.x * tileSize;
    const nextY = nextPathPoint.y * tileSize;
    //借机判断
    const unitX = Math.floor(this.owner.x / tileSize);
    const unitY = Math.floor(this.owner.y / tileSize);
    let haveMoveToNewTile = false;
    if (
      unitX !== this.currentGrids[0]?.x ||
      unitY !== this.currentGrids[0]?.y
    ) { 
      haveMoveToNewTile = true;
      this.oldGrids = this.currentGrids;
      this.currentGrids = UnitSystem.getInstance().getUnitGrids(this.owner);
    }
    //判断是否需要移动到新的格子

    if (haveMoveToNewTile) {

      BattleEvenetSystem.getInstance().handleEvent('moveToNewGridEvent', this.owner);
      // 检查是否有单位可以触
      if (this.walkType != "step") this.checkOpportunity(this.oldGrids);
    }
    //
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
  clearHaveOpportunity() {
    this.haveOpportunity = [];
  }
  movefunc(
    unit: Unit,
    nextX: number,
    nextY: number,
    path: { x: number; y: number }[]
  ) {
    const spriteUnit = unit;
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
        spriteUnit.x = this.targetX * tileSize;
        spriteUnit.y = this.targetY * tileSize;
        if (this.owner.animUnit) {
          console.log(
            "到达目标位置，停止移动",
            this.targetX * tileSize,
            this.targetY * tileSize,
            this.owner.animUnit.x,
            this.owner.animUnit.y
          );
        } else {
          console.log(
            "到达目标位置，停止移动",
            this.targetX * tileSize,
            this.targetY * tileSize,
            "animUnit未定义"
          );
        }
        this.path = []; // 清空路径
        this.owner.state = "idle"; // 设置单位状态为闲置
        this.callBack(); // 调用回调函数
        this.callBack = () => {};
      }
    }
  }
  checkOpportunity = (startMoveGrids: { x: number; y: number }[]) => {
    const mayOpportunityUnit = OpportunitySystem.getOpportunityUnit(
      startMoveGrids,
      this.owner
    );
    const opportunityUnit: Unit[] = [];
    if (mayOpportunityUnit.length > 0) {
      // 如果有单位可以触发借机，则暂停移动
      mayOpportunityUnit.forEach((unit) => {
        if (!this.haveOpportunity.includes(unit.id)) {
          this.haveOpportunity.push(unit.id);
          opportunityUnit.push(unit);
        }
      });
    }
    if (opportunityUnit.length > 0) {
      // 如果有多个单位可以触发借机，则按照 InitiativeSheet 的顺序处理
      this.pauseMove = true; // 暂停移动
      OpportunitySystem.opportunitysHandle(this.owner, opportunityUnit).then(
        () => {
          this.pauseMove = false; // 恢复移动
        }
      );
    } else {
      console.log("没有单位可以触发借机");
    }
  };
}
