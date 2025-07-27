export interface WeaponOptions {
    name: string;
    type: string; // e.g. "sword", "bow", "staff"
    damage: string; // e.g. "1d8", "1d6+2"
    bonus?: number; // attack bonus
    range?: number;
    properties?: string[]; // e.g. ["versatile", "finesse"]
    weight?: number;
    cost?: number;
    description?: string;
}

export class Weapon {
    name: string;
    type: string;
    damage: string;
    bonus:number=0 ;
    range?: number;
    properties: string[];
    weight?: number;
    cost?: number;
    description?: string;

    constructor(options: WeaponOptions) {
        this.name = options.name;
        this.type = options.type;
        this.damage = options.damage;
        this.bonus = options.bonus || 0;
        this.range = options.range;
        this.properties = options.properties || [];
        this.weight = options.weight;
        this.cost = options.cost;
        this.description = options.description;
    }
}
