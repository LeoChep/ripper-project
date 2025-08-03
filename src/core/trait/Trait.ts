import type { Modifier } from "../modifier/Modifier";
import type { Unit } from "../units/Unit";

export class TraitOptions {
     name?: string;
     displayName?: string;
     description?: string;
     icon?: string;
     type?: string;
     owner?: Unit | null;
     hookTime?: string;
   } 
export  class Trait {
   hook() {
     throw new Error("Method not implemented.");
   }
   constructor(traitOptions: TraitOptions) {
     this.name = traitOptions.name || "";
     this.displayName = traitOptions.displayName || "";
     this.description = traitOptions.description || "";
     this.icon = traitOptions.icon || "";
     this.type = traitOptions.type || "trait";
     this.owner = traitOptions.owner || null;
     this.hookTime = traitOptions.hookTime || "";
   }
   name = "";
   displayName="";
   description = "";
   icon = "";
   type = "";
   owner: Unit | null = null; //
   hookTime = "";
   modifiers= [] as Modifier[]; // Trait的修饰符列表
}
