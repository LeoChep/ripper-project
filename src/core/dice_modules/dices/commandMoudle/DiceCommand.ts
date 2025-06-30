import { subscribe } from "../../../tool_modules/SubscribeMan/SubscribeMan";
import {
  DiceFormula,
  parseDiceFormula,
  type Formula,
} from "../DiceFormulaTrans";
import { Roller } from "../rollerMoudle";

class DiceCommand {
  command: string;
  formula!: Formula;
  proxy = this;
  value = "";
  excute(): Promise<any> {
    const resultPromise = [] as Promise<any>[];
    Roller.dicesplugin.cleanDices();
    const rollDice = async (formula: Formula) => {
      for (const formulaItem of formula.children) {
        if (formulaItem.type === "formula") rollDice(formulaItem);
        if (formulaItem.type === "diceFormula") {
          const diceFormulaItem = formulaItem as DiceFormula;
          diceFormulaItem.diceRoller = new Roller();
          let diceRoller = diceFormulaItem.diceRoller as Roller;
          diceRoller = subscribe(diceRoller, "value", () => {
            this.proxy.value =
              this.formula.toString() + "=" + this.formula.getValue();
          });
          await diceRoller.rollXdY(formulaItem.text);
          resultPromise.push(diceRoller.getResult());
          console.log(diceRoller);
        }
      }
      return Promise.all(resultPromise);
    };
    return rollDice(this.formula);
  }
  constructor(conmand: string) {
    this.command = conmand;
    this.formula = parseDiceFormula(this.command);
  }
  state = state.wait;
}
enum state {
  success,
  error,
  wait,
  running,
}
export { DiceCommand, state };
