import { Area } from "../area/Area";
import type { AreaSerializeData } from "../area/AreaSerializeData";

export class AreaSystem {
  private areas: Area[] = [];
  private static instance: AreaSystem;

  private constructor() {}

  static getInstance(): AreaSystem {
    if (!AreaSystem.instance) {
      AreaSystem.instance = new AreaSystem();
    }
    return AreaSystem.instance;
  }

  addArea(area: Area): void {
    this.areas.push(area);
  }

  removeArea(area: Area): void {

    // this.areas = this.areas.filter((a) => a !== area);
    area.effects.forEach((effect) => {
      effect.remove();
    })
  }

  getAreas(): Area[] {
    return this.areas;
  }

  getArea(uid:string):Area|null{
    return this.areas.find(area => area.uid === uid) || null;
  }
  clearAreas(): void {
    this.areas = [];
  }
  getSaver() {
    const areaSerializerDatas: AreaSerializeData[] = [];
    this.areas.forEach((area) => {
      areaSerializerDatas.push(Area.getSerializer().serialize(area));
    });
    return areaSerializerDatas;
  }
  loadRecords(data: AreaSerializeData[]): void {
    this.clearAreas();
    data.forEach((item) => {
      const area = Area.getSerializer().deserialize(item);
      if (area) {
        this.addArea(area);
      }
    });
  }
  rebuildAreas(): void {
    console.log("重建区域特效",this.areas);
    this.areas.forEach((area) => {
      area.buildEffect();
    });
  }
}
