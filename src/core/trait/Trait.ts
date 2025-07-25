import type { Unit } from "../units/Unit";

export  class Trait {
   hook() {
     throw new Error("Method not implemented.");
   }
   name = "";
   displayName="";
   description = "";
   icon = "";
   type = "";
   owner: Unit | null = null; //
   hookTime = "";
}
