import { StateMachine } from "./StateMachine";
import type { Unit } from "../units/Unit";
export class StateMachinePack {
  constructor(owner: Unit) {
    this.owner = owner;
  }
  private machines: Map<string, StateMachine> = new Map();
  public owner: Unit;

  public addMachine(name: string, machine: StateMachine): void {
    this.machines.set(name, machine);
  }

  public getMachine(name: string): StateMachine | undefined {
    return this.machines.get(name);
  }

  public removeMachine(name: string): void {
    this.machines.delete(name);
  }

  public clear(): void {
    this.machines.clear();
  }
  public doAction(): void {
    const name = this.owner.state;
    const machine = this.getMachine(name);
    const animUnit = this.owner.animUnit;
    if (animUnit) {
      // console.log('执行状态机动作', name, '单位位置:', this.owner, animUnit);
      animUnit.x = this.owner.x;
      animUnit.y = this.owner.y;
      // console.log(
      //   "执行状态机动作",
      //   name,
      //   "单位位置:",
      //   this.owner.x,
      //   this.owner.y
      // );
    }
    if (machine) {
      machine.doAction();
    } else {
      console.warn(`状态机 ${name} 不存在`);
    }
  }
 
}
