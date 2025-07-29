import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import type { Unit } from "@/core/units/Unit";
import { defineStore } from "pinia";

export const useCharacterStore = defineStore("character", {
  state: () => ({
    characters: [] as Array<Unit>,
    show: false,
    selectedCharacterId: null as number | null,
  
  }),
  actions: {
    setCharacterOutCombatController(controller: CharacterOutCombatController) {
    },
    addCharacter(character: Unit) {
      this.characters.push(character);
    },
    selectCharacter(character: Unit) {
      // CharacterOutCombatController.instance?.selectCharacter(character)
    },

    setShow(show: boolean){this.show = show},
  },
  getters: {

    getShow(state) {
      return state.show;
    }
  },
});
