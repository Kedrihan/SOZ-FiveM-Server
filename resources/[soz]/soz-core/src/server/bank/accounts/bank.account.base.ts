export class AccountShell {
    constructor() { }

    public async load(id: string, owner: string, coords: any = null): Promise<[number | bigint, boolean]> {
        console.log(`^8${this.toString()}:load() is not implemented !`);
        return [0, false];
    }

    public accessAllowed(owner: string, player: string): boolean {
        console.log(`^8${this.toString()}:AccessAllowed() is not implemented !`);
        return true;
    }

    public async save(id: string, owner: string, money: number | bigint, marked_money: number | bigint): Promise<boolean> {
        console.log(`^8${this.toString()}:save() is not implemented !`);
        return false;
    }

    public toString(): string {
        return this.constructor.name;
    }
}
