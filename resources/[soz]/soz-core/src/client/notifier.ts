import { Injectable } from '../core/decorators/injectable';

@Injectable()
export class Notifier {
    public notify(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'success') {
        exports['soz-hud'].DrawNotification(message, type);
    }

    public advancedNotify(
        title: string,
        subtitle: string,
        message: string,
        image: string,
        type: 'error' | 'success' | 'warning' | 'info' = 'success',
        delay?: number
    ) {
        exports['soz-hud'].DrawAdvancedNotification(title, subtitle, message, image, type, delay);
    }

    public error(source: number, message: string) {
        this.notify(message, 'error');
    }
}
