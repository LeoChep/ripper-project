export class Modifier {
  to: string = ""; // 目标属性
  value: number = 0; // 修改值
  type: string = ""; // 加值类型,如威能，专长
  condition:string|undefined = undefined
  modifierType: string = ""; // 操作符类型,如 +，-，*，/ ，=
  //优先级
  priority: number = 0; // 优先级，决定应用顺序,从大到小
  constructor(options: {
    to: string;
    value: number;
    type: string;
    modifierType: string;
    //条件
    condition?:string;
    priority?: number; // 可选参数，默认为0
  }) {
    this.to = options.to;
    this.value = options.value;
    this.type = options.type;
    this.modifierType = options.modifierType;
    this.condition = options.condition;
  }
}
