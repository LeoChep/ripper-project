import type { Unit } from "../units/Unit";

export class InitiativeClass {
    initativeValue: number;
    owner?: Unit;
    standerActionNumber:number=0;
    minorActionNumber:number=0;
    moveActionNumber:number=0;
    reactionNumber:number=0;
    
    ready:boolean=true;
    constructor(initativeValue: number) {
        this.initativeValue = initativeValue;
    }
}