export class Modifier {
    to: string=''; // 目标属性
    value: number=0; // 修改值
    type: string=''; // 加值类型,如威能，专长
    modifierType: string=''; // 操作符类型,如 +，-，*，/ ，=
    constructor(options: {
        to: string;
        value: number;
        type: string;
        modifierType: string;   
    }) {
        this.to = options.to;
        this.value = options.value;
        this.type = options.type;
        this.modifierType = options.modifierType;
    }
}