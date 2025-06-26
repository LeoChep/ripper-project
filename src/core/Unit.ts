import type { UnitAnimSpirite } from "./UnitAnimSpirite";

export interface UnitOptions {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    party: string;
    unitTypeName: string;
    gid?: number;
    direction: number; // 方向，0-3 分别表示上、右、下、左
}

export class Unit  {
    id: number;
    name: string;
    party: string;
    unitTypeName: string;
    gid?: number;
    x: number;
    y: number;
    width: number;
    height: number;
    animUnit : UnitAnimSpirite | undefined;
    direction: number = 0; // 方向，0-3 分别表示上、右、下、左
    constructor(options: UnitOptions) {
      
        this.id = options.id;
        this.name = options.name;
        this.x = options.x;
        this.y = options.y;
        this.width = options.width;
        this.height = options.height;
        this.party = options.party;
        this.direction = options.direction 
        this.unitTypeName = options.unitTypeName;
        this.gid = options.gid;
    }
}

// 工厂函数：根据 map.sprites 生成 Unit 实例数组
export function createUnitsFromMapSprites(sprites: any[]): Unit[] {
    return sprites.map(obj => {
        const partyProp = obj.properties?.find((p: any) => p.name === 'party');
        const unitTypeNameProp = obj.properties?.find((p: any) => p.name === 'unitTypeName');
        const directionProp = obj.properties?.find((p: any) => p.name === 'direction');
        return new Unit({
            id: obj.id,
            name: obj.name,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            party: partyProp ? partyProp.value : '',
            unitTypeName: unitTypeNameProp ? unitTypeNameProp.value : '',
            gid: obj.gid,
            direction: directionProp? directionProp.value : 2 // 默认方向为 0
        });
    });
}

// 工厂函数：根据单个 sprite 对象生成 Unit 实例
export function createUnitFromSprite(obj: any): Unit {
    const partyProp = obj.properties?.find((p: any) => p.name === 'party');
    const unitTypeNameProp = obj.properties?.find((p: any) => p.name === 'unitTypeName');
     const directionProp = obj.properties?.find((p: any) => p.name === 'direction');
    return new Unit({
        id: obj.id,
        name: obj.name,
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        party: partyProp ? partyProp.value : '',
        unitTypeName: unitTypeNameProp ? unitTypeNameProp.value : '',
         direction: directionProp? directionProp.value : 2, // 默认方向为 0
        gid: obj.gid
    });
}
