import { ulid } from 'ulid';

export abstract class QueueItem {
    public readonly id: string;

    public sortId: string;

    public constructor(sortId?: string) {
        this.id = ulid();
        this.sortId = sortId ?? this.id;
    }

    public setSortId(sortId?: string|null): this {
        this.sortId = sortId ?? ulid();
        return this;
    }

    public toString(): string {
        return this.id;
    }

    public abstract getSourceURL(): Promise<string>;
}