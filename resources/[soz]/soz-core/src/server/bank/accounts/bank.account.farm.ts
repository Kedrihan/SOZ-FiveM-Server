import { AccountShell } from "./bank.account.base";
import { Injectable } from "@public/core/decorators/injectable";

@Injectable()
export class FarmAccount extends AccountShell {

    constructor() {
        super();
    }

    public async save(id: string, owner: string, amount: number | bigint, marked_money: number | bigint): Promise<boolean> {
        return true
    }
}