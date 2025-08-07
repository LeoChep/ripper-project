import type { Unit } from "@/core/units/Unit";

let characterStore = {
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
    this.selectedCharacter = character;
    this.selectedCharacterId = character.id;
  },
};

export const useCharacterStore = () => {
  return characterStore;
};
