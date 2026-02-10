import type { TiledMap } from "@/core/MapClass";
import { DramaSystem } from "@/core/system/DramaSystem";

export abstract class Drama {
  name: string;
  description: string;
  map: TiledMap | null = null;
  variables: Map<string, any> = new Map();
  mapName: string = "";
  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }
  public battleEndHandle(): void {}
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

  protected CGstart = (): void => {
    const dramaSystem = DramaSystem.getInstance();
    dramaSystem.CGstart();
  };
  protected unHiddenUnit = async (unitName: string): Promise<void> => {
    const dramaSystem = DramaSystem.getInstance();
    await dramaSystem.unHiddenUnit(unitName);
  }
  protected CGEnd = (): void => {
    const dramaSystem = DramaSystem.getInstance();
    dramaSystem.CGEnd();
  };

  protected unitSpeak = async (
    unitName: string,
    text: string,
  ): Promise<void> => {
    const dramaSystem = DramaSystem.getInstance();
    await dramaSystem.unitSpeak(unitName, text);
  };

  protected speak = async (text: string): Promise<void> => {
    const dramaSystem = DramaSystem.getInstance();
    await dramaSystem.speak(text);
  };

  protected unitChoose = async (
    unitName: string,
    options: { text: string; value: string }[],
    prompt?: string,
  ): Promise<string> => {
    const dramaSystem = DramaSystem.getInstance();
    return await dramaSystem.unitChoose(unitName, options, prompt);
  };
  protected addInteraction = (
    unitName: string,
    event: (...args: any[]) => {},
  ) => {
    const dramaSystem = DramaSystem.getInstance();
    dramaSystem.addInteraction(unitName, event);
  };
  loadInit(): void {}
  abstract play(): void;
}
