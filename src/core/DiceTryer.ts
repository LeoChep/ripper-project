import { DiceCommander } from "./dice_modules/dices/commandMoudle/DiceCommander";
import { Roller } from "./dice_modules/dices/rollerMoudle";
import { MathDicePlugin } from "./dice_modules/mathDicePluginMoudle/MathDice";
import { subscribe } from "./tool_modules/SubscribeMan/SubscribeMan";
const diceCommander = new DiceCommander();
Roller.dicesplugin = new MathDicePlugin();
export async function diceRoll(s: string): Promise<string> {
  console.log("diceRoll",s)
  const command = diceCommander.excute(s);
  const endPromise = new Promise<string>((resolve) => {
    subscribe(command, "value", () => {
        const result=command.formula.getValue()
      resolve(result.toString());
    });
  });
  await endPromise;
  console.log('endPromise',endPromise)
  return endPromise;
}
