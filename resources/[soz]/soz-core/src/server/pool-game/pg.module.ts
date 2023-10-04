import { Module } from '../../core/decorators/module';
import { PoolGameProvider } from './pg.provider';

@Module({
    providers: [PoolGameProvider],
})
export class PoolGameModule {}
