import { d1 } from "@/drama/d1";
interface DialogOption {
  text: string;
  value: any;
}
export class DramaSystem {
  private dramaMap: Map<string, any> = new Map();
  static instance: DramaSystem;
  records = [] as { name: any; variables: unknown[] }[];
  interval = null as unknown as NodeJS.Timeout;
  dramaUse: any;

  static getInstance(): DramaSystem {
    if (!DramaSystem.instance) {
      DramaSystem.instance = new DramaSystem();
      initDramaMap();
    }
    return DramaSystem.instance;
  }
  constructor() {
    // Initialize the drama system if needed
  }

  registerDrama(name: string, drama: any): void {
    this.dramaMap.set(name, drama);
  }

  getDrama(name: string): any | undefined {
    return this.dramaMap.get(name);
  }

  async setDramaUse(dramaName: string): Promise<void> {
    const drama = this.getDrama(dramaName);
    let varliabeleArr: any[] = [];
    this.records.forEach((record) => {
      if (record.name === dramaName) {
        varliabeleArr = record.variables;
      }
    });
    this.dramaUse = drama;
    await drama.load(varliabeleArr);
  }

  play(): void {
    const interval = setInterval(() => {
      if (this.dramaUse) {
        this.dramaUse.play();
      } else {
        console.warn("No drama is set to play.");
      }
    }, 100);
    this.interval = interval;
  }
  stop(): void {
    clearInterval(this.interval);
    if (this.dramaUse) {
      this.dramaUse = null;
    } else {
      console.warn("No drama is currently playing.");
    }
  }

  speak = async (content: string): Promise<void> => {};
  unitSpeak = async (unitName: string, content: string): Promise<void> => {};
  choose = async (options: DialogOption[]): Promise<any> => {};
  unitChoose = async (
    unitName: string,
    options: DialogOption[],
    dialogText?: string,
  ): Promise<any> => {};
  // createUnit = async (
  //   unitName: string,
  //   x: number,
  //   y: number,
  // ): Promise<void> => {
  //   const unitJson = await getUnitTypeJsonFile(unitName);
  //   const creature = createCreature(unitJson as any);
  //   const unitCreature = creature;
  //  const unit=createUnitFromUnitInfo({});
  //  unit.creature=unitCreature;
  // };
  CGstart = () => {};
  CGEnd = () => {};
  clearDramas(): void {
    this.dramaMap.clear();
  }
  getRercords() {
    const recorders: { name: any; variables: unknown[] }[] = [];
    this.dramaMap.forEach((drama, name) => {
      const vars = drama.variables as Map<string, any>;
      const varsArr: any[] = [];

      vars.forEach((variable, key) => {
        varsArr.push({ name: key, value: variable });
      });

      recorders.push({
        name: drama.name,
        variables: varsArr,
      });
    });
    return { use: this.dramaUse?.name, recorders };
  }
}
const initDramaMap = () => {
  const dramaSystem = DramaSystem.getInstance();
  dramaSystem.registerDrama("d1", d1);
};
