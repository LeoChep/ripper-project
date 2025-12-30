import type { Modifier } from "../modifier/Modifier";
import type { Unit } from "../units/Unit";
class valueStack {
  modifiers: Modifier[] = [];
  finalValue: number = 0;
}
export class ModifierSystem {
  static instance: ModifierSystem | null = null;
  cache: Map<string, valueStack> = new Map();
  static getInstance() {
    if (!ModifierSystem.instance) {
      ModifierSystem.instance = new ModifierSystem();
    }
    return ModifierSystem.instance;
  }
  static getFianleValue(unit: Unit, valueName: string): number {
    return ModifierSystem.getInstance().getValueStack(unit, valueName).finalValue;
  }

  static getCacheKey(unit: Unit, valueName: string): string {
    return `${unit.id}.${valueName}`;
  }
  getValueStack(unit: Unit, valueName: string) {
    const key = ModifierSystem.getCacheKey(unit, valueName);
    if (this.cache.get(key) !== undefined) {
      return this.cache.get(key)!;
    } else {
      //计算新的 valueStack

      this.updatateValueStack(unit, valueName);
      const newValueStack = this.cache.get(key)!;
      console.log(`ModifierSystem.getValueStack: ${key}` ,newValueStack),unit;
      return newValueStack;
    }
  }
  updatateValueStack(unit: Unit, valueName: string) {
    const key = ModifierSystem.getCacheKey(unit, valueName);
    const newValueStack = new valueStack();
    const buffs = unit.creature?.buffs || [];
    for (const buff of buffs) {
      const modifier = buff.modifiers.find((mod) => mod.to === valueName);
      if (modifier) {
        newValueStack.modifiers.push(modifier);
        // newValueStack.finalValue += modifier.value;
      }
    }
    const feats = unit.creature?.feats || [];
    console.log(`ModifierSystem.getValueStack: ${key}`, feats);
    for (const feat of feats) {
      if (!feat.modifiers) {
        console.warn(`Feat ${feat.name} has no modifiers.`);
        continue;
      }
      const modifier = feat.modifiers.find((mod) => mod.to === valueName);
      if (modifier) {
        newValueStack.modifiers.push(modifier);
        // newValueStack.finalValue += modifier.value;
      }
    }
    newValueStack.finalValue = this.getBasicValue(unit, valueName);
    //排序
    newValueStack.modifiers.sort((a, b) => b.priority - a.priority);
    //生成一个新的modifier列表，他根据 newValueStack.modifiers生成，但是相同type的modifier取高
    const typeMap: Map<string, Modifier> = new Map();
    for (const modifier of newValueStack.modifiers) {
      const key = `${modifier.type}.${modifier.modifierType}`;
      if (!typeMap.has(key)) {
        typeMap.set(key, modifier);
      } else {
        const existingModifier = typeMap.get(key)!;
        if (modifier.priority > existingModifier.priority) {
          typeMap.set(key, modifier);
        }
      }
    }
    const diffModifiers = Array.from(typeMap.values());
    diffModifiers.sort((a, b) => b.priority - a.priority);
    for (const modifier of diffModifiers) {
      if (modifier.modifierType === "+") {
        newValueStack.finalValue += modifier.value;
      } else if (modifier.modifierType === "-") {
        newValueStack.finalValue -= modifier.value;
      } else if (modifier.modifierType === "*") {
        newValueStack.finalValue *= modifier.value;
      } else if (modifier.modifierType === "/") {
        newValueStack.finalValue /= modifier.value;
      } else if (modifier.modifierType === "=") {
        newValueStack.finalValue = modifier.value;
      }
    }
    this.cache.set(key, newValueStack);
  }
  getBasicValue(unit: Unit, valueName: string): number {
    // 获取单位的基础值
    const valuePath = this.getValuePath(valueName);
    let obj = unit.creature as { [key: string]: any };
    for (let i = 0; i < valuePath.length; i++) {
      const path = valuePath[i];
      if (obj?.[path] === undefined) {
        return 0;
      }
      obj = obj?.[path];
    }
    if (typeof obj === "number") {
      return obj;
    }
    return 0; // 示例返回值
  }
  getValuePath(valuePath: string): string[] {
    // 将 valuePath 字符串转换为数组
    return valuePath.split(".");
  }
}
