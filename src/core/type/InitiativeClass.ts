import type { Unit } from "../units/Unit";

export class InitiativeClass {
    initativeValue: number;
    owner: Unit|null = null; // 可能为 null，表示没有拥有者
    standerActionNumber:number=0;
    minorActionNumber:number=0;
    moveActionNumber:number=0;
    reactionNumber:number=0;
    roundNumber:number=0;
    ready:boolean=true;

    constructor(initativeValue: number) {
        this.initativeValue = initativeValue;
    }
}