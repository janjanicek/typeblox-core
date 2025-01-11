type EventCallback = (...args: any[]) => void;
export declare class EventEmitter {
    private events;
    on(event: string, callback: EventCallback): void;
    off(event: string, callback: EventCallback): void;
    emit(event: string, ...args: any[]): void;
}
export {};
