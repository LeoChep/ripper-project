import type { Dice, DicesPlugin } from "../dices/rollerMoudle";

class MathDicePlugin implements DicesPlugin {
  roll(diceType: string): Promise<Dice> {
    return new Promise<MathDice>((resolve) => {
      const dice = new MathDice(diceType);
      dice.resultValue = new Promise((resolve) => {
        dice.value = dice.rolling();
        resolve(dice.value);
      });
      console.log(dice);
      resolve(dice);
    });
  }
  cleanDices(): void {}
}
class MathDice implements Dice {
  //异步类
  diceType: string;
  resultValue!: Promise<number>; //结果数值
  value: number; //当前数值
  getValue = () => {
    return this.value;
  };
  getResultValue = () => {
    return this.resultValue;
  };
  rolling() {
    const range = this.diceType.replace("d", "");
    return Math.floor(Math.random() * parseInt(range)) + 1;
  }
  constructor(type: string) {
    this.diceType = type;
    this.value = 0;
  }
}
export { MathDicePlugin, MathDice };
