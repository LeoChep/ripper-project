import { defineStore } from 'pinia'
import { InitiativeClass } from '../core/type/InitiativeClass'
import type { Unit } from '../core/Unit'

export const useInitiativeStore = defineStore('initiative', {
  state: () => ({
    currentInitiative: new InitiativeClass(0)
  }),

  getters: {
    getInitiativeValue: (state) => state.currentInitiative.initativeValue,
    getOwner: (state) => state.currentInitiative.owner,
    getStanderActionNumber: (state) => state.currentInitiative.standerActionNumber,
    getMinorActionNumber: (state) => state.currentInitiative.minorActionNumber,
    getMoveActionNumber: (state) => state.currentInitiative.moveActionNumber,
    isReady: (state) => state.currentInitiative.ready
  },

  actions: {
    initializeInitiative(initativeValue: number) {
      this.currentInitiative = new InitiativeClass(initativeValue)
    },

    setOwner(owner: Unit) {
      this.currentInitiative.owner = owner
    },

    updateActionNumbers(stander: number, minor: number, move: number) {
      this.currentInitiative.standerActionNumber = stander
      this.currentInitiative.minorActionNumber = minor
      this.currentInitiative.moveActionNumber = move
    },

    setReady(ready: boolean) {
      this.currentInitiative.ready = ready
    },

    resetInitiative() {
      this.currentInitiative = new InitiativeClass(0)
    },
    setIniitiative(initative: InitiativeClass) {
        this.currentInitiative = initative
    }
  }
})
