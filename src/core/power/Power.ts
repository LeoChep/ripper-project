export class Power {
  name: string = "";
  displayName: string = "";
  description: string = "";
  keyWords: string[] = [""];
  level: string = "";
  powersource: string = "martial";
  secondPowersource: string = "";
  subName: string = "";
  prepared: boolean = true;
  powerType: string = "class";
  powerSubtype: string = "attack";
  useType: string = "atwill";
  actionType: string = "standard";
  requirements: string = "";
  weaponType: string = "melee";
  weaponUse: string = "default";
  rangeType: string = "weapon";
  rangeTextShort: string = "";
  rangeText: string = "";
  rangePower: string = "";
  area: number = 0;
  rechargeRoll: string = "";
  rechargeCondition: string = "";
  damageShare: boolean = false;
  postEffect: boolean = true;
  postSpecial: boolean = true;
  autoGenChatPowerCard: boolean = true;
  sustain: { actionType: string; detail: string } = {
    actionType: "none",
    detail: "",
  };
  target: string = "One Creature";
  trigger: string = "";
  requirement: string = "";
  hookTime: string = "";
    owner: any;
  hook = () => {};
  constructor(obj: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
