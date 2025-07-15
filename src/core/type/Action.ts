export class Action{
    private fn: (...args: any[]) => any;
    private args: any[];

    constructor(fn: (...args: any[]) => any, args: any[]) {
        this.fn = fn;
        this.args = args;
    }

    doAction(): any {
        return this.fn(...this.args);
    }
}