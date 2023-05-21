import { Invoice } from '@public/shared/bank';

import { Inject, Injectable } from '../../core/decorators/injectable';

import { Repository } from './repository';
import { PrismaService } from '../database/prisma.service';
import { Job, JobPermission } from '@public/shared/job';
import { PlayerData } from '@public/shared/player';
import { JobPermissionService } from '@public/client/job/job.permission.service';

@Injectable()
export class BankInvoiceRepository extends Repository<Record<string, Record<number, Invoice>>> {
    @Inject(PrismaService)
    private prismaService: PrismaService;
    @Inject(JobPermissionService)
    private jobPermissionService: JobPermissionService;
    private Invoices: Record<string, Record<number, Invoice>> = {};

    protected async load(): Promise<Record<string, Record<number, Invoice>>> {
        const invoices = await this.prismaService.invoices.findMany({
            where: {
                payed: false,
                refused: false,
            },
        });

        for (const invoice of invoices) {
            if (invoice.targetAccount === null) {
                continue;
            }

            this.Invoices[invoice.targetAccount] = this.Invoices[invoice.targetAccount] || {};
            this.Invoices[invoice.targetAccount][invoice.id] = {
                id: invoice.id,
                label: invoice.label,
                amount: invoice.amount,
                createdAt: invoice.created_at.getTime(),
                payed: invoice.payed,
                refused: invoice.refused,
                citizenid: invoice.citizenid,
                targetAccount: invoice.targetAccount,
                emitter: invoice.emitter,
                emitterName: invoice.emitterName,
                emitterSafe: invoice.emitterSafe,
            };
        }
        return this.Invoices;
    }

    public createInvoice(
        id: number,
        targetAccount: string,
        emitter: PlayerData,
        target: PlayerData,
        allJobs: Job[],
        label: string,
        amount: number,
    ) {
        if (!this.Invoices[targetAccount]) {
            this.Invoices[targetAccount] = {};
        }
        this.Invoices[targetAccount][id] = {
            id: id,
            citizenid: target.citizenid,
            emitter: emitter.citizenid,
            emitterName: allJobs[emitter.job.id].label,
            emitterSafe: `safe_${emitter.job.id}`,
            targetAccount: targetAccount,
            label: label,
            amount: amount,
            createdAt: new Date().getTime(),
            payed: false,
            refused: false,
        };
    }

    public getInvoice(account: string, id: number): Invoice | null {
        if (!this.Invoices[account] || !this.Invoices[account][id]) {
            return null;
        }
        return this.Invoices[account][id];
    }
    public getAllInvoices(): Record<string, Record<number, Invoice>> {
        return this.Invoices;
    }

    public deleteInvoice(account: string, id: number): void {
        if (!this.Invoices[account] || !this.Invoices[account][id]) {
            return;
        }
        delete this.Invoices[account][id];
    }
    public playerHaveAccessToInvoices(player: PlayerData, account: string): boolean {
        if (player.charinfo.account === account) {
            return true;
        }
        return this.jobPermissionService.hasPermission(player.job.id, JobPermission.SocietyBankInvoices);
    }
}
