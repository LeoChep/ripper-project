import { getFrontObjInfoJsonFile } from "@/utils/utils";

interface AnchorPoint {
  x: number;
  y: number;
}

interface BlockSlotPoint {
  x: number;
  y: number;
}

interface FrontObjInfo {
  x: number;
  y: number;
  name: string;
  occlusionHeight: number;
  width: number;
  height: number;
  scale?: number; // 添加 scale 属性
  anchor?: AnchorPoint; // 添加 anchor 属性
  blockSlot?: BlockSlotPoint[][]; // 添加 blockSlot 属性
}
interface FrontObjAssetInfo {
  name: string;
  fronts: FrontObjInfo[];
}
export class FrontObjSystem {
  private static instance: FrontObjSystem;
  public static getInstance = () => {
    if (!FrontObjSystem.instance) {
      FrontObjSystem.instance = new FrontObjSystem();
    }
    return FrontObjSystem.instance;
  };
  public frontAssets: Map<string, FrontObjAssetInfo> = new Map();
  loadAsset =  (mapName: string): Promise<any> => {

    const promisee= new Promise((resolve, reject) => {
      getFrontObjInfoJsonFile(mapName, "frontObj").then(
        (frontObjAssetInfo: any) => {
          console.log("Loaded front object asset info:", frontObjAssetInfo);
          this.frontAssets.set(mapName, {name:mapName,fronts:frontObjAssetInfo});
          resolve(frontObjAssetInfo);
        }
      ).catch((error) => {
        console.error("Failed to load front object asset info:", error);
        reject(error);
      });
    });
    return promisee;
  };
  getFrontObjInfo(mapName: string, objName: string): FrontObjInfo | null {
    const assetInfo = this.frontAssets.get(mapName);
    console.log(`Getting front object info for map: ${mapName}, object: ${objName}`,assetInfo);
    if (assetInfo) {
      const frontObjInfo = assetInfo.fronts.find((obj) => obj.name === objName);
      console.log(`Found front object info:`, frontObjInfo);
      return frontObjInfo || null;
    }
    return null;
  }
  constructor() {}
}
