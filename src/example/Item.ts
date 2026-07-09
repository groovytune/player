import { QueueItem } from '../lib/classes/QueueItem.ts';

export class Item extends QueueItem {
    public name: string;
    public artist: string;
    public cover: string|null;
    public file: File;

    public sourceURL: string|null = null;

    public constructor(options: { name: string; artist: string; cover: string|null; file: File }) {
        super();

        this.name = options.name;
        this.artist = options.artist;
        this.cover = options.cover;
        this.file = options.file;
    }

    public async getSourceURL(): Promise<string> {
        return this.sourceURL || (this.sourceURL = URL.createObjectURL(this.file));
    }
}