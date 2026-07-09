import { Queue } from "./Queue.svelte.js";
import type { QueueItem } from './QueueItem.ts';

export class AudioPlayer<I extends QueueItem = QueueItem> {
    public audio: HTMLAudioElement|null = null;
    public queue: Queue<I> = new Queue<I>();

    public status: AudioPlayer.Status = $state('stopped');
    public repeat: AudioPlayer.RepeatMode = $state('none');
    public paused: boolean = $state(true);
    public volume: number = $state(1);
    public duration: number = $state(0);
    public currentTime: number = $state(0);

    public progress: number = $derived(this.duration ? (this.currentTime / this.duration) * 100 : 0);

    public current: I|null = $derived(this.queue?.current ?? null);
    public nextable: boolean = $derived(this.queue?.nextable ?? false);
    public previousable: boolean = $derived(this.queue?.previousable ?? false);
    public shuffled: boolean = $derived(this.queue?.shuffled ?? false);

    private frameId: number|null = null;
    private abortController: AbortController|null = null;

    public async init(options?: AudioPlayer.Options<I>): Promise<void> {
        this.audio = options?.audio ?? new Audio();
        this.queue = options?.queue instanceof Queue
            ? options.queue
            : options?.queue
                ? new Queue(options.queue)
                : this.queue;

        this.audio.preload = 'metadata';
        this.audio.crossOrigin = 'anonymous';

        this.abortController = new AbortController();

        this.on(
            ['seeked', 'seeking'],
            () => this.currentTime = this.audio?.currentTime ?? 0,
            { passive: true }
        );

        this.on(
            ['pause', 'play', 'playing', 'waiting', 'loadstart'],
            () => this.paused = this.audio?.paused ?? true,
            { passive: true }
        );

        this.on(
            ['play', 'playing'],
            () => this.status = 'playing',
            { passive: true }
        );

        this.on(
            ['waiting', 'loadstart'],
            () => this.status = 'buffering',
            { passive: true }
        );

        this.on(
            'volumechange',
            () => this.volume = this.audio?.volume ?? 1,
            { passive: true }
        );

        this.on(
            'durationchange',
            () => this.duration = this.audio?.duration ?? 0,
            { passive: true }
        );

        this.on(
            ['ended', 'abort', 'error'],
            async event => {
                const isError = event.type === 'error';

                if (event.type === 'abort') {
                    this.stop();
                    return;
                }

                if (this.repeat === 'one') {
                    if (isError) {
                        if (this.nextable) {
                            this.next();
                        }

                        return;
                    }

                    this.setCurrentTime(0);
                    await this.audio?.play();
                    return;
                }

                if (this.nextable) {
                    this.next();
                    return;
                } else if (this.repeat === 'all') {
                    if (this.previousable) {
                        this.previous(this.queue.history.length - 1);
                        return;
                    } else if (this.current) {
                        this.setCurrentTime(0);
                        await this.audio?.play();
                        return;
                    }
                }

                this.stop();
                this.status = isError ? 'error' : 'stopped';
            },
            { passive: true }
        );

        this.queue.on('currentChange', async item => {
            if (!this.audio) return;

            const paused = this.audio.paused;

            this.audio.pause();
            this.audio.currentTime = 0;

            if (item) {
                this.audio.src = await item?.getSourceURL();
                this.audio.load();

                if (!paused) {
                    await this.audio.play();
                }
            } else {
                this.audio.src = '';
            }
        });

        this.startFrameLoop();
    }

    public destroy(): void {
        this.abortController?.abort();
        this.abortController = null;

        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio.remove();
            this.audio = null;
        }

        this.queue.clear();
        this.queue.removeAllListeners();
    }

    public async play(item?: I): Promise<void> {
        if (!this.audio) return;

        if (this.current) {
            if (item) {
                this.queue.add([this.current]);
            }

            await this.audio.play();
            return;
        }

        item ??= this.queue.items.shift();
        if (!item) return;

        this.queue.setCurrentItem(item);

        await this.queue.waitForAllListenersToComplete();
        await this.audio.play();
    }

    public stop(): void {
        if (this.queue.current) {
            this.queue.history.unshift(this.queue.current);
            this.queue.current = null;
        }

        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.src = '';
        }

        this.status = 'stopped';
    }

    public setCurrentTime(time: number): void {
        if (!this.audio || !this.current || !this.audio.seekable || !Number.isFinite(this.duration)) return;

        this.currentTime = this.audio.currentTime = Math.min(Math.max(time, 0), this.duration);
    }

    public setVolume(volume: number): void {
        if (!this.audio) return;

        this.volume = this.audio.volume = Math.min(Math.max(volume, 0), 1);
    }

    public setRepeatMode(mode: AudioPlayer.RepeatMode): void {
        this.repeat = mode;
    }

    public pause(): void {
        if (!this.audio) return;

        this.audio.pause();
    }

    public shuffle(): void {
        this.queue.shuffle();
    }

    public unshuffle(): void {
        this.queue.unshuffle();
    }

    public async next(index: number = 0): Promise<void> {
        if (!this.nextable && this.current) {
            this.queue.setCurrentItem(null, 'history');
            return;
        }

        this.queue.next(index);
            await this.queue.waitForAllListenersToComplete();
            await this.audio?.play();
    }

    public async previous(index: number = 0): Promise<void> {
        if (this.currentTime > 5 || !this.previousable) {
            this.setCurrentTime(0);
            return;
        }

        this.queue.previous(index);
        await this.queue.waitForAllListenersToComplete();
        await this.audio?.play();
    }

    public remove(item: I|string|number, from: 'queue'|'history' = 'queue'): I|null {
        return this.queue.remove(item, from);
    }

    public async togglePlay(): Promise<void> {
        if (!this.audio) return;

        if (this.audio.paused) {
            await this.play();
        } else {
            this.pause();
        }
    }

    public toggleRepeatMode(): void {
        switch (this.repeat) {
            case 'none':
                this.repeat = 'one';
                break;
            case 'one':
                this.repeat = 'all';
                break;
            case 'all':
                this.repeat = 'none';
                break;
        }
    }

    public toggleShuffle(): void {
        if (this.queue.shuffled) {
            this.unshuffle();
        } else {
            this.shuffle();
        }
    }

    public on<K extends keyof HTMLMediaElementEventMap>(event: K|K[], listener: (this: HTMLAudioElement, ev: HTMLMediaElementEventMap[K]) => any, options?: AddEventListenerOptions): void {
        const events = Array.isArray(event) ? event : [event];

        for (const event of events) {
            this.audio?.addEventListener(
                event,
                listener,
                {
                    signal: this.abortController?.signal,
                    ...options
                }
            );
        }
    }

    public off<K extends keyof HTMLMediaElementEventMap>(event: K|K[], listener: (this: HTMLAudioElement, ev: HTMLMediaElementEventMap[K]) => any): void {
        const events = Array.isArray(event) ? event : [event];

        for (const event of events) {
            this.audio?.removeEventListener(event, listener);
        }
    }

    protected startFrameLoop(): void {
        if (typeof requestAnimationFrame === 'undefined') return;

        const onFrame = () => {
            this.currentTime = this.audio?.currentTime ?? 0;
            this.frameId = requestAnimationFrame(onFrame);
        }

        this.frameId = requestAnimationFrame(onFrame);
    }

    protected stopFrameLoop(): void {
        if (this.frameId === null || typeof cancelAnimationFrame === 'undefined') return;

        cancelAnimationFrame(this.frameId);
        this.frameId = null;
    }
}

export namespace AudioPlayer {
    export type RepeatMode = 'none'|'one'|'all';
    export type Status = 'playing'|'paused'|'stopped'|'buffering'|'error';

    export interface Options<I extends QueueItem = QueueItem> {
        audio?: HTMLAudioElement;
        queue?: Queue<I>|Queue.Options<I>;
    }
}