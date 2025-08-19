import { UuidUtil } from "../utils/UuidUtil";

export class Effect {
  uid: string;
  
  build(...args: any[]) {}
  remove(...args:any[]){}
  constructor(uid?: string) {
    this.uid = uid ? uid : UuidUtil.generate();
  }
}
