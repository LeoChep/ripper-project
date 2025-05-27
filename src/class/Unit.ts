export class Unit {
    uuid: number;
    name: string;
    imageUrl: string;

    constructor(uuid: number, name: string, imageUrl: string) {
        this.uuid = uuid;
        this.name = name;
        this.imageUrl = imageUrl;
    }
}