import { Invoice } from '@public/shared/bank';
import { Injectable } from '../../core/decorators/injectable';
import { Result } from '../../shared/result';
import { emitRpc } from '@public/core/rpc';
import { RpcServerEvent } from '@public/shared/rpc';

@Injectable()
export class BankService {
    public transferCashMoney(source: string, target: number, amount: number): Promise<Result<boolean, string>> {
        return emitRpc<Result<boolean, string>>(RpcServerEvent.BANK_TRANSFER_CASH_MONEY, source, target, amount);
    }
}
