<script lang="ts">
    import { Queue } from '$lib/classes/Queue.svelte';
    import { flip } from 'svelte/animate';
    import { QueueItem } from '../lib/classes/QueueItem.ts';
    import { faker } from '@faker-js/faker';

    class Item extends QueueItem {
        public name = faker.music.songName();
        public artist = faker.music.artist();

        public constructor() {
            super();
        }

        public async getSourceURL(): Promise<string> {
            return '';
        }
    }

    const queue = new Queue<Item>({
        items: [
            new Item(),
            new Item(),
            new Item()
        ]
    });

    queue.on('currentChange', (current) => {
        console.log('Current item changed:', current);
    });

    queue.on('next', (item) => {
        console.log('Next item:', item);
    });

    queue.on('previous', (item) => {
        console.log('Previous item:', item);
    });
</script>

<h1>Queue</h1>
<div>
    <button
        onclick={() => queue.add([new Item()])}
    >
        Add Item
    </button>
    <button
        onclick={() => queue.clear()}
    >
        Clear Queue
    </button>
    <button
        onclick={() => queue.shuffled ? queue.unshuffle() : queue.shuffle()}
    >
        {queue.shuffled ? 'Unshuffle' : 'Shuffle'}
    </button>
    <button
        onclick={() => queue.previous()}
    >
        Previous
    </button>
    <button
        onclick={() => queue.next(0, false)}
    >
        Next
    </button>
</div>
<div>
    <h3>Items</h3>
    <ol>
        {#each queue.items as item (item.id)}
            <li animate:flip={{ duration: 300 }}>
                <a
                    href="/#"
                    onclick={event => {
                        event.preventDefault();
                        queue.remove(item);
                    }}
                >
                    remove
                </a>
                {item.name} by {item.artist}
            </li>
        {/each}
    </ol>
</div>
{#if queue.current}
    <p>{queue.current?.name} by {queue.current?.artist}</p>
{/if}
<div>
    <h3>History</h3>
    <ol>
        {#each queue.history.toReversed() as item (item.id)}
            <li animate:flip={{ duration: 300 }}>
                <a
                    href="/#"
                    onclick={event => {
                        event.preventDefault();
                        queue.remove(item);
                    }}
                >
                    remove
                </a>
                {item.name} by {item.artist}
            </li>
        {/each}
    </ol>
</div>