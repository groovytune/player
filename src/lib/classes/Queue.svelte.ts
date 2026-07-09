import { ulid } from 'ulid';
import type { QueueItem } from './QueueItem.ts';
import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';

export class Queue<I extends QueueItem = QueueItem> extends AsyncEventEmitter<Queue.Events<I>> {
    public items: I[] = $state([]);
    public history: I[] = $state([]);
    public current: I|null = $state(null);

    public shuffled: boolean = $state(false);

    public nextable: boolean = $derived(this.items.length > 0);
    public previousable: boolean = $derived(this.history.length > 0);

    public constructor(options?: Queue.Options<I>) {
        super();

        this.items = options?.items ?? [];
        this.history = options?.history ?? [];
        this.current = options?.current ?? null;
        this.shuffled = options?.shuffled ?? false;
    }

    public add(items: I[], next: boolean = false): void {
        items.forEach(i => i.setSortId());

        if (next) {
            this.items.unshift(...items);
        } else {
            this.items.push(...items);
        }

        this.emit('addItems', items);
    }

    public remove(track: I|string|number, from: 'queue'|'history' = 'queue'): I|null {
        const list = from === 'queue' ? this.items : this.history;
        const index = typeof track === 'number' ? track : list.findIndex(i => i.id === track.toString());

        const item = index !== -1
            ? list.splice(index, 1).at(0) ?? null
            : null;

        if (item) {
            this.emit('removeItem', item, from);
        }

        return item;
    }

    public clear(): void {
        this.items = [];
        this.history = [];
        this.setCurrentItem(null);
    }

    public shuffle(shuffler: (items: I[]) => I[] = Queue.shuffleArray): void {
        const shuffled = this.items.map((item, index) => item.setSortId(ulid(Date.now() + index)));

        this.items = shuffler(shuffled);
        this.shuffled = true;

        this.emit('shuffleToggle', this.shuffled);
    }

    public unshuffle(): void {
        this.items = this.items.sort((a, b) => a.sortId.localeCompare(b.sortId));
        this.shuffled = false;

        this.emit('shuffleToggle', this.shuffled);
    }

    public next(index: number = 0): void {
        if (index < 0 || index >= this.items.length) {
            return;
        }

        const history = this.items.splice(0, index);
        const nextItem = this.items.shift() ?? null;

        this.setCurrentItem(nextItem, 'history');

        if (history.length || nextItem) {
            for (const item of history) {
                this.history.unshift(item);
            }

            this.emit('next', nextItem);
            return;
        }
    }

    public previous(index: number = 0): void {
        if (index < 0 || index >= this.history.length) {
            return;
        }

        const addToQueue = this.history.splice(0, index);
        const previousItem = this.history.shift() ?? null;

        this.setCurrentItem(previousItem, 'queue');

        if (addToQueue.length || previousItem) {
            for (const item of addToQueue) {
                this.items.unshift(item);
            }

            this.emit('previous', previousItem);
            return;
        }
    }

    public setCurrentItem(item: I|null, moveOldTo: 'queue'|'history'|null = null): void {
        if (this.current && moveOldTo) {
            if (moveOldTo === 'queue') {
                this.items.unshift(this.current);
            } else {
                this.history.unshift(this.current);
            }
        }

        this.current = item;
        this.emit('currentChange', this.current);
    }
}

export namespace Queue {
    export interface Events<I extends QueueItem = QueueItem> {
        addItems: [items: I[]];
        removeItem: [item: I, from: 'queue'|'history'];
        shuffleToggle: [shuffled: boolean];
        currentChange: [current: I|null];
        next: [item: I|null];
        previous: [item: I|null];
    }

    export interface Options<I extends QueueItem = QueueItem> {
        shuffled?: boolean;
        items?: I[];
        history?: I[];
        current?: I|null;
    }

    export function shuffleArray<T>(array: T[], mutate: boolean = true): T[] {
        array = mutate ? array : [...array];

        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
    }
}