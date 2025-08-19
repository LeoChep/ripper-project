import type { Effect } from "../effect/Effect";
import { UuidUtil } from "../utils/UuidUtil";

export class Area{
    uid:string
    effects:Effect[]
    
    constructor(uid?:string) {

        this.uid=uid?uid:UuidUtil.generate();
        this.effects=[];
    }
    buildEffect(){
        for (const effect of this.effects) {
            effect.build();
        }
    }
   
    
}