import { createCreature, createCreatureOptions } from "./Creature";
import { expect, test } from 'vitest'


test('test', async () => {
 
 await fetch("http://localhost:5173/src/assets/EarthArchonRumbler/EarthArchonRumbler.txt")
    .then(response => response.text())
    .then(txt => {
        const creature = createCreatureOptions(txt);
        console.log(creature);
    })
    .catch(error => console.error("Error fetching angle.txt:", error));     
})
