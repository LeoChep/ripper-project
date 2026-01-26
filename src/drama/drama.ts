import type { TiledMap } from "@/core/MapClass";
import { DramaSystem } from "@/core/system/DramaSystem";

export abstract class Drama {
  name: string;
  description: string;
  map: TiledMap | null = null;
  variables: Map<string, any> = new Map();

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  async load(variables: { name: string; value: any }[]): Promise<void> {
    const dramaSystem = DramaSystem.getInstance();
    await dramaSystem.load(this, variables);
  }

  getVariable(key: string): any {
    const dramaSystem = DramaSystem.getInstance();
    return dramaSystem.getVariable(this, key);
  }

  setVariable(key: string, value: any): void {
    const dramaSystem = DramaSystem.getInstance();
    dramaSystem.setVariable(this, key, value);
  }

  abstract play(): void;
}