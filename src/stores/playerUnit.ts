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
                new Unit(3, 'Unit 3', testImg),
                new Unit(4, 'Unit 4', testImg),
                new Unit(5, 'Unit 5', testImg),
                new Unit(6, 'Unit 6', testImg),
                new Unit(7, 'Unit 7', testImg),
                new Unit(8, 'Unit 8', testImg),
                new Unit(9, 'Unit 9', testImg),
                new Unit(10, 'Unit 10', testImg),
                new Unit(11, 'Unit 11', testImg),
                new Unit(12, 'Unit 12', testImg),
                new Unit(13, 'Unit 13', testImg),
                new Unit(14, 'Unit 14', testImg),
                new Unit(15, 'Unit 15', testImg),
                new Unit(16, 'Unit 16', testImg),
                new Unit(17, 'Unit 17', testImg),
                new Unit(18, 'Unit 18', testImg),
                new Unit(19, 'Unit 19', testImg),
                new Unit(20, 'Unit 20', testImg)
            ]
        }
    }
})