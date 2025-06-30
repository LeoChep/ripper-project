import { subscribe } from "../../tool_modules/SubscribeMan/SubscribeMan";

interface DicesPlugin {
  roll: (diceType: string) => Promise<Dice>;
  cleanDices: () => void;
}
interface Dice {
  //异步类
  diceType: string;
  resultValue: Promise<number>; //结果数值
  value: number; //当前数值
  getValue: () => number;
  getResultValue: () => Promise<number>;
}
export default {};
class Roller {
  static dicesplugin: DicesPlugin;
  proxy: any;
  dices = [] as (Promise<Dice> | Dice)[];
  value = 0;
  constructor() {
    this.proxy = this;
  }
  //根据骰子类型就行异步投掷，返回生成的骰子
  async roll(diceType: string): Promise<Dice> {
    const dicePromise = Roller.dicesplugin.roll(diceType);
    let dice = await dicePromise;
    this.proxy.dices.push(dice);

    this.value = 0;
    for (const item of this.dices) {
      this.proxy.value += (await item).getValue();
    }
    //订阅监听骰子当前值，并计算整个roller骰组的结果
    dice = subscribe(dice, "value", async () => {
      let totalRollValue = 0;
      for (const item of this.dices) {
        totalRollValue += (await item).getValue();
      }
      if (this.proxy.value !== totalRollValue) {
        this.proxy.value = totalRollValue;
      }
    });
    return dice;
  }
  //异步投掷多个
  rollndx = async (n: number, x: string) => {
    //建立异步骰子数组，保存异步生成的骰子
    const dices = [] as (Promise<Dice> | Dice)[];
    for (let i = 0; i < n; i++) {
      const t = i;
      const dice = new Promise<Dice>((resolve) => {
        setTimeout(() => {
          resolve(this.roll(x));
        }, 50 * t);
      });
      dices.push(dice);
    }
    //返回异步请求的骰子数组
    return Promise.all(dices);
  };
  //通过指令投掷
  rollXdY = async (xdy: string) => {
    const regex = /(\d*)d(\d+)/g;
    const matches = xdy.matchAll(regex);
    const dices = Array.from(matches, (match) => {
      const count = match[1] === "" ? 1 : parseInt(match[1]);
      const sides = parseInt(match[2]);
      return this.rollndx(count, "d" + sides);
    });
    return Promise.all(dices);
  };
  getValue = () => {
    return this.value;
  };
  getResult = async () => {
    //等待所有骰子创建完毕
    const dices = await Promise.all(this.dices);
    //创建结果数组，异步等待每个骰子的结果
    console.log(dices);
    const resultValuePromiseList = [] as Promise<number>[];

    for (const dice of dices) {
      resultValuePromiseList.push(dice.getResultValue());
    }
    Promise.all(resultValuePromiseList).then(() => {
      console.log("投掷结束");
    });
    const resultValueList = await Promise.all(resultValuePromiseList);
    let resultValueCount = 0;
    for (const resultValue of resultValueList) {
      resultValueCount = resultValue + resultValueCount;
    }
    const result = {
      dices: dices,
      resultValue: resultValueCount,
      resultValueList: resultValueList,
    };
    return result;
  };

  toString() {
    let des = this.value + "";
    for (const item of this.dices) {
      const itemIns = item as Dice;
      des += `,` + itemIns.value;
    }
    des = des.replace(",", "[") + `]`;
    return des;
  }
}
export { Roller };
export type { DicesPlugin, Dice };
