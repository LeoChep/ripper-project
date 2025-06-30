import { DiceCommand } from "./DiceCommand";
import { DiceCommandQueue } from "./DiceCommandQueue";

class DiceCommander {
  conmandQueue: DiceCommandQueue;
  constructor() {
    this.conmandQueue = new DiceCommandQueue();
  }
  excute(input: string) {
    const command = new DiceCommand(input);
    this.conmandQueue.push(command);
    return command;
  }
}
export { DiceCommander };
