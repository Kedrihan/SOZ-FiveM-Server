import { Injectable } from '@core/decorators/injectable';
import { emitQBRpc } from '@core/rpc';
import { CurrentBank } from '@public/shared/bank';

@Injectable()
export class BankCurrentService {
    private currentBank: CurrentBank;

    public async getCurrentBank(): Promise<CurrentBank> {
        return this.currentBank;
    }

    public async setCurrentBank(bank: CurrentBank): Promise<void> {
        this.currentBank = bank;
    }
}
