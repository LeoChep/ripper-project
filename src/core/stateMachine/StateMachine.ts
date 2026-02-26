
import type { Unit } from "../units/Unit";

export class StateMachine {
    public currentState: string | null = null;
    public owner!: Unit;
    constructor(unit:Unit) {
        this.owner = unit;
        // 初始化状态机
    }

    public setState(state: string): void {
        this.currentState = state;
    }

    public getState(): string | null {
        return this.currentState;
    }

    public  doAction(){

    }
    public stop() {
        // 停止当前状态的行为
    }
}