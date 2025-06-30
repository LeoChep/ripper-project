import { Queue } from "datastructures-algorithms-ts";
import type { DiceCommand } from "./DiceCommand";

class DiceCommandQueue {
  list: Queue<DiceCommand>;
  constructor() {
    this.list = new Queue<DiceCommand>();
  }
  push(diceCommand: DiceCommand) {
    this.list.enqueue(diceCommand);
    if (this.list.size() === 1) {
      this.excute();
    }
  }
  excute() {
    this.list
      .peek()
      .excute()
      .then(() => {
        console.log("excuted");
        this.list.dequeue();
        if (!this.list.isEmpty()) this.excute();
      });
  }
}
export { DiceCommandQueue };
