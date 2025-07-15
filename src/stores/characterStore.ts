import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import type { Unit } from "@/core/units/Unit";
import { defineStore } from "pinia";

export const useCharacterStore = defineStore("character", {
  state: () => ({
    characters: [] as Array<Unit>,
    show: false,
    selectedCharacterId: null as number | null,
    characterOutCombatController: null as CharacterOutCombatController | null, // 初始化时传入空的参数，实际使用时会替换
  }),
  actions: {
    setCharacterOutCombatController(controller: CharacterOutCombatController) {
        this.characterOutCombatController = controller;
    },
    addCharacter(character: Unit) {
      this.characters.push(character);
    },
    selectCharacter(character: Unit) {
      this.characterOutCombatController?.selectCharacter(character)
    },
    removeCharacter(id: number) {
      this.characters = this.characters.filter((c) => c.id !== id);
      if (this.selectedCharacterId === id) {
        this.selectedCharacterId = null;
      }
    },
    setShow(show: boolean){this.show = show},
  },
  getters: {
    selectedCharacter(state) {
      return (
        state.characters.find((c) => c.id === state.selectedCharacterId) || null
      );
      
    },
    getShow(state) {
      return state.show;
    }
  },
});
