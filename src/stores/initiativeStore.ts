import { defineStore } from "pinia";
import { InitiativeClass } from "../core/type/InitiativeClass";
import type { Unit } from "../core/units/Unit";
import {
  getUnits,
  getPointAtUnit,
  getPointAtInitiative,
} from "@/core/system/InitiativeSystem";
export const useInitiativeStore = defineStore("initiative", {
  state: () => ({
    currentInitiative: new InitiativeClass(0),
    currentUnitId: 0 as number | null,
    initiativeUnits: [] as Unit[], // 新增：用于存储所有参与先攻的单位
  }),

  getters: {
    getInitiativeValue: (state) => state.currentInitiative.initativeValue,
    getOwner: (state) => state.currentInitiative.owner,

    isReady: (state) => state.currentInitiative.ready,
    // 新增：返回按先攻值降序排列的单位数组
    sortedUnits: (state) => {
      return [...state.initiativeUnits].sort((a, b) => {
        return (
          (b.initiative?.initativeValue ?? 0) -
          (a.initiative?.initativeValue ?? 0)
        );
      });
    },
  },

  actions: {
    initializeInitiative() {
      this.currentInitiative = getPointAtInitiative() || new InitiativeClass(0);
      this.currentUnitId = this.currentInitiative.owner ? this.currentInitiative.owner.id : null;
      this.initiativeUnits = getUnits();
    },

    setOwner(owner: Unit) {
      this.currentInitiative.owner = owner;
    },

    updateActionNumbers(stander: number, minor: number, move: number) {
      this.currentInitiative.standerActionNumber = stander;
      this.currentInitiative.minorActionNumber = minor;
      this.currentInitiative.moveActionNumber = move;
      console.log(`更新主动权: ${stander}, ${minor}, ${move}`);
    },

    setReady(ready: boolean) {
      this.currentInitiative.ready = ready;
    },

    resetInitiative() {
      this.currentInitiative = new InitiativeClass(0);
    },
    setIniitiative(initative: InitiativeClass) {
      // this.currentInitiative = initative;
      this.currentUnitId = initative.owner ? initative.owner.id : null;
    },
    // 新增：设置先攻单位列表
    setInitiativeUnits(units: Unit[]) {
      this.initiativeUnits = units;
    },
  },
});
