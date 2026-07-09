<script lang="ts">
    import { flip } from 'svelte/animate';
    import { QueueItem } from '../lib/classes/QueueItem.ts';
    import { faker } from '@faker-js/faker';
    import { AudioPlayer } from '../lib/classes/AudioPlayer.svelte.ts';
    import { onDestroy, onMount } from 'svelte';

    class Item extends QueueItem {
        public name = faker.music.songName();
        public artist = faker.music.artist();
        public sourceURL = faker.internet.url();

        public constructor(name?: string, artist?: string, sourceURL?: string) {
            super();

            this.name = name ?? this.name;
            this.artist = artist ?? this.artist;
            this.sourceURL = sourceURL ?? this.sourceURL;
        }

        public async getSourceURL(): Promise<string> {
            return this.sourceURL;
        }
    }

    const player = new AudioPlayer<Item>();

    onMount(async () => {
        await player.init();

        player.queue.on('currentChange', (current) => {
            console.log('Current item changed:', current);
        });
    });

    onDestroy(() => {
        player.destroy();
    });
</script>

<h1>Queue</h1>
<div>
    progress: {player.currentTime.toFixed(2)}s / {player.duration.toFixed(2)}s
    ({player.progress.toFixed(2)}%)
</div>
<div>
    <button
        onclick={() => player.previous()}
    >
        Previous
    </button>
    <button
        onclick={() => player.togglePlay()}
    >
        {player.paused ? 'Play' : 'Pause'}
    </button>
    <button
        onclick={() => player.next()}
    >
        Next
    </button>
    <br>
    <button
        onclick={() => player.queue.clear()}
    >
        Clear Queue
    </button>
    <button
        onclick={() => player.shuffled ? player.unshuffle() : player.shuffle()}
    >
        {player.shuffled ? 'Unshuffle' : 'Shuffle'}
    </button>
    <button
        onclick={() => player.toggleRepeatMode()}
    >
        Repeat {player.repeat}
    </button>
    <br>
    <input
        type="file"
        accept="audio/*"
        multiple={true}
        onchange={async (event) => {
            const files = event.currentTarget.files;
            if (!files?.length) return;

            const items: Item[] = [];
            for (const file of files) {
                const url = URL.createObjectURL(file);
                items.push(new Item(file.name, 'Unknown Artist', url));
            }

            player.queue.add(items);
        }}
    >
</div>
<div>
    <h3>Items</h3>
    <ol>
        {#each player.queue.items as item, index (item.id)}
            <li animate:flip={{ duration: 300 }}>
                <a
                    href="/#"
                    onclick={event => {
                        event.preventDefault();
                        player.remove(item);
                    }}
                >
                    remove
                </a>
                <a
                    href="/#"
                    onclick={event => {
                        event.preventDefault();
                        player.next(index)
                    }}
                >
                    Play
                </a>
                {item.name} by {item.artist}
            </li>
        {/each}
    </ol>
</div>
{#if player.current}
    <p>{player.current?.name} by {player.current?.artist}</p>
{/if}
<div>
    <h3>History</h3>
    <ol>
        {#each player.queue.history as item, index (item.id)}
            <li animate:flip={{ duration: 300 }}>
                <a
                    href="/#"
                    onclick={event => {
                        event.preventDefault();
                        player.remove(item, 'history');
                    }}
                >
                    remove
                </a>
                <a
                    href="/#"
                    onclick={event => {
                        event.preventDefault();
                        player.previous(index)
                    }}
                >
                    Play
                </a>
                {item.name} by {item.artist}
            </li>
        {/each}
    </ol>
</div>