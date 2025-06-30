
import { expect, test } from 'vitest'
import { diceRoll } from './DiceTryer'


test('test', async () => {
 
 diceRoll("1d20+5").then((result) => {
   console.log(result);
//    expect(result).toMatch(/1d20\+5=\d+/);
 }).catch((error) => {
   console.error("Error during dice roll:", error);
   expect(error).toBeNull(); // 确保没有错误发生
 });
})
