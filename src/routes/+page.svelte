<script lang="ts">
    import { flip } from 'svelte/animate';
    import { Item } from '../example/Item.ts';
    import { AudioPlayer } from '../lib/classes/AudioPlayer.svelte.ts';
    import { getContext } from 'svelte';
    import { parseBlob, selectCover } from 'music-metadata';
    import KawarpBackground from '../lib/components/KawarpBackground.svelte';
    import { FastForwardIcon, PauseIcon, PlayIcon, Repeat1Icon, RepeatIcon, RepeatOffIcon, RewindIcon, ShuffleIcon, Trash2Icon } from '@lucide/svelte';
    import AMLLBackground from '../lib/components/AMLLBackground.svelte';

    const player: AudioPlayer<Item> = getContext('player');

    let background: null|'kawarp'|'mesh'|'pixi' = $state(null);
</script>

<div class="m-2 p-2 bg-zinc-200/60 rounded-xl border border-zinc-300/50 flex items-center gap-2">
    <img src={player.current?.cover ?? ''} alt="Cover Art" class="w-32 h-32 object-cover bg-zinc-300 rounded-lg" />
    <div class="flex flex-col">
        <h1 class="text-lg font-medium leading-tight">{player.current?.name ?? 'No Track Playing'}</h1>
        <p class="text-sm text-zinc-600 leading-tight">{player.current?.artist ?? 'Unknown Artist'}</p>
        <div class="flex gap-4 [&_svg]:fill-current mt-2">
            <button
                onclick={() => player.previous()}
                class="size-10 bg-zinc-300 flex justify-center items-center rounded-full"
            >
                <RewindIcon class="size-5"/>
            </button>
            <button
                onclick={() => player.togglePlay()}
                class="size-10 bg-zinc-300 flex justify-center items-center rounded-full"
            >
                {#if player.paused}
                    <PlayIcon class="size-5"/>
                {:else}
                    <PauseIcon class="size-5"/>
                {/if}
            </button>
            <button
                onclick={() => player.next()}
                class="size-10 bg-zinc-300 flex justify-center items-center rounded-full"
            >
                <FastForwardIcon class="size-5"/>
            </button>
        </div>
    </div>
</div>
<div class="m-2 p-2 bg-zinc-200/60 rounded-xl border border-zinc-300/50 flex items-center gap-2">
    <button
        onclick={() => player.queue.clear()}
        class="size-10 bg-zinc-300 flex justify-center items-center rounded-full"
    >
        <Trash2Icon class="size-5"/>
    </button>
    <button
        onclick={() => player.shuffled ? player.unshuffle() : player.shuffle()}
        class="size-10 bg-zinc-300 flex justify-center items-center rounded-full"
    >
        {#if player.shuffled}
            <ShuffleIcon class="text-pink-500"/>
        {:else}
            <ShuffleIcon/>
        {/if}
    </button>
    <button
        onclick={() => player.toggleRepeatMode()}
        class="size-10 bg-zinc-300 flex justify-center items-center rounded-full"
    >
        {#if player.repeat === 'none'}
            <RepeatOffIcon/>
        {:else if player.repeat === 'one'}
            <Repeat1Icon/>
        {:else if player.repeat === 'all'}
            <RepeatIcon/>
        {/if}
    </button>
    <button
        onclick={() => {
            switch (background) {
                case null:
                    background = 'kawarp';
                    break;
                case 'kawarp':
                    background = 'mesh';
                    break;
                case 'mesh':
                    background = 'pixi';
                    break;
                case 'pixi':
                    background = null;
                    break;
            }
        }}
        class="size-10 bg-zinc-300 flex justify-center items-center rounded-full"
    >
        {#if background === null}
            <p class="text-sm">None</p>
        {:else if background === 'kawarp'}
            <p class="text-sm">Kawarp</p>
        {:else if background === 'mesh'}
            <p class="text-sm">Mesh</p>
        {:else if background === 'pixi'}
            <p class="text-sm">Pixi</p>
        {/if}
    </button>
    <input
        type="file"
        accept="audio/*"
        multiple={true}
        class="h-10 bg-zinc-300 rounded-full py-2 px-4"
        onchange={async (event) => {
            const files = event.currentTarget.files;
            if (!files?.length) return;

            const items: Item[] = [];

            for (const file of files) {
                const metadata = await parseBlob(file);
                const cover = selectCover(metadata.common.picture);
                const coverURL = cover ? URL.createObjectURL(
                    // @ts-expect-error: cover.data is a Buffer, but URL.createObjectURL expects a Blob
                    new Blob([cover.data],
                    { type: cover.format })
                ) : null;

                items.push(new Item({
                    name: metadata.common.title || file.name,
                    artist: metadata.common.artist || 'Unknown Artist',
                    cover: coverURL,
                    file
                }));
            }

            player.queue.add(items);
        }}
    >
</div>
<div class="grid grid-cols-2">
    <div class="m-2 p-2 bg-zinc-200/60 rounded-xl border border-zinc-300/50">
        <h3 class="text-lg font-semibold mb-2">Queue</h3>
        <div class="flex flex-col gap-2">
            {#each player.queue.items as item, index (item.id)}
                <div
                    animate:flip={{ duration: 300 }}
                    class="flex items-center gap-2 p-2 bg-zinc-300/50 rounded-lg"
                    style="content-visibility: auto;"
                >
                    <button
                        onclick={event => {
                            event.preventDefault();
                            player.next(index)
                        }}
                        class="size-8 bg-zinc-300 flex justify-center items-center rounded-full"
                    >
                        <PlayIcon class="size-4"/>
                    </button>
                    <p>{item.name} by {item.artist}</p>
                    <button
                        onclick={event => {
                            event.preventDefault();
                            player.remove(item);
                        }}
                        class="opacity-0 hover:opacity-100 focus-visible:opacity-100 size-8 bg-red-500/5 text-red-600 flex justify-center items-center rounded-full ml-auto"
                    >
                        <Trash2Icon class="size-4"/>
                    </button>
                </div>
            {/each}
        </div>
    </div>
    <div class="m-2 p-2 bg-zinc-200/60 rounded-xl border border-zinc-300/50">
        <h3 class="text-lg font-semibold mb-2">History</h3>
        <div class="flex flex-col gap-2">
            {#each player.queue.history as item, index (item.id)}
                <div
                    animate:flip={{ duration: 300 }}
                    class="flex items-center gap-2 p-2 bg-zinc-300/50 rounded-lg"
                    style="content-visibility: auto;"
                >
                    <button
                        onclick={event => {
                            event.preventDefault();
                            player.previous(index)
                        }}
                        class="size-8 bg-zinc-300 flex justify-center items-center rounded-full"
                    >
                        <PlayIcon class="size-4"/>
                    </button>
                    <p>{item.name} by {item.artist}</p>
                    <button
                        onclick={event => {
                            event.preventDefault();
                            player.remove(item, 'history');
                        }}
                        class="opacity-0 hover:opacity-100 focus-visible:opacity-100 size-8 bg-red-500/5 text-red-600 flex justify-center items-center rounded-full ml-auto"
                    >
                        <Trash2Icon class="size-4"/>
                    </button>
                </div>
            {/each}
        </div>
    </div>
</div>
{#if background === 'kawarp'}
    <KawarpBackground
        image={player.current?.cover ?? ''}
        style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;"
    />
{:else if background === 'mesh' || background === 'pixi'}
    <AMLLBackground
        renderType={background}
        image={player.current?.cover ?? ''}
        style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;"
    />
{/if}