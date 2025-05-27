import { defineStore } from 'pinia'
import { Unit } from '@/class/Unit'
import testImg from '@/assets/logo.svg'
// 假设 Unit 类已定义在同目录下的 Unit.ts 文件中

export const usePlayerUnitStore = defineStore('playerUnit', {
    state: () => ({
        units: [] as Unit[]
    }),
    actions: {
        addUnit(unit: Unit) {
            this.units.push(unit)
        },
        removeUnit(index: number) {
            this.units.splice(index, 1)
        },
        setUnits(units: Unit[]) {
            this.units = units
        },
        clearUnits() {
            this.units = []
        },
        setTestUnits() {
            this.units = [
                new Unit(1, 'Unit 22222222222222221', testImg),
                new Unit(2, 'Unit 2', testImg),
                new Unit(3, 'Unit 3', testImg)
            ]
        }
    }
})