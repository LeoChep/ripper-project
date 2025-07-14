import type { Unit } from '@/core/units/Unit';
import { defineStore } from 'pinia'

export const useCharacterStore = defineStore('character', {
    state: () => ({
        characters: [] as Array<Unit>,
        selectedCharacterId: null as number | null,
    }),
    actions: {
        addCharacter(character: Unit) {
            this.characters.push(character)
        },
        selectCharacter(id: number) {
            this.selectedCharacterId = id
        },
        removeCharacter(id: number) {
            this.characters = this.characters.filter(c => c.id !== id)
            if (this.selectedCharacterId === id) {
                this.selectedCharacterId = null
            }
        },
    },
    getters: {
        selectedCharacter(state) {
            return state.characters.find(c => c.id === state.selectedCharacterId) || null
        },
    },
})