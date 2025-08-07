
export class FlagSystem {

  flags: { [key: string]: boolean } = {};

  constructor() {}

  setFlag(flagName: string, value: boolean): void {
    this.flags[flagName] = value;
  }

  getFlag(flagName: string): boolean {
    return this.flags[flagName] || false;
  }

  toggleFlag(flagName: string): void {
    this.flags[flagName] = !this.flags[flagName];
  }

  clearFlag(flagName: string): void {
    delete this.flags[flagName];
  }

  clearAllFlags(): void {
    this.flags = {};
  }
}