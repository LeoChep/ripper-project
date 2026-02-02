import { CharacterController } from "@/core/controller/CharacterController";
import type { Unit } from "@/core/units/Unit";

const characterStore = {
  characters: [] as Unit[],
  show:true,
  selectedCharacterId: 0,
  selectedCharacter: null as Unit | null,
  addCharacter(character: Unit) {
    this.characters.push(character);
  },
  clearCharacters() {
    this.characters = [];
  },
  setShow(show: boolean) {
    this.show = show;
  },
  getShow() {
    return this.show;
  },
  selectCharacter(character: Unit) {
    console.log('selectCharacter中角色:', character);
    characterStore.selectedCharacter = character;
    characterStore.selectedCharacterId = character.id;
  },
};

export const useCharacterStore = () => {
  return characterStore;
};
