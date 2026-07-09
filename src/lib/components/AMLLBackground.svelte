<script lang="ts">
    import type { BackgroundRender, MeshGradientRenderer, PixiRenderer } from '@applemusic-like-lyrics/core';
    import { onDestroy, onMount } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';

    let {
        ref = $bindable(null),
        loaded = $bindable(false),
        renderer = $bindable(null),
        renderType = 'mesh',
        image,
        playing = true,
        fps = 30,
        flowSpeed = 2,
        renderScale = 2,
        staticMode = false,
        lowFreqVolume = 2.5,
        hasLyric = true,
        ...props
    }: {
        ref?: HTMLDivElement|null;
        renderer?: BackgroundRender<MeshGradientRenderer|PixiRenderer>|null;
        renderType?: 'mesh'|'pixi';
        loaded?: boolean;
        image: string|HTMLImageElement;
        playing?: boolean;
        fps?: number;
        flowSpeed?: number;
        renderScale?: number;
        staticMode?: boolean;
        lowFreqVolume?: number;
        hasLyric?: boolean;
    } & HTMLAttributes<HTMLDivElement> = $props();

    onMount(async () => {
        if (!ref) return;

        const { BackgroundRender, MeshGradientRenderer, PixiRenderer } = await import('@applemusic-like-lyrics/core');

        switch (renderType) {
            case 'mesh':
                renderer = BackgroundRender.new(MeshGradientRenderer);
                break;
            case 'pixi':
                renderer = BackgroundRender.new(PixiRenderer);
                break;

        }

        const element = renderer.getElement();

        element.style.width = '100%';
        element.style.height = '100%';

        // eslint-disable-next-line svelte/no-dom-manipulating
        ref.appendChild(element);
    });

    onDestroy(() => {
        renderer?.dispose();
    });

    $effect(() => {
        if (!renderer) return;

        if (playing) {
            renderer.resume();
        } else {
            renderer.pause();
        }

        renderer.setFPS(fps);
        renderer.setFlowSpeed(flowSpeed);
        renderer.setRenderScale(renderScale);
        renderer.setStaticMode(staticMode);
        renderer.setLowFreqVolume(lowFreqVolume);
        renderer.setHasLyric(hasLyric);
    });

    $effect(() => {
        if (!renderer) return;

        loaded = false;

        renderer
            .setAlbum(image)
            .then(() => loaded = hasCover())
    });

    function hasCover() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mesh = (renderer as any)?.renderer as { isNoCover?: boolean; };
        return mesh && 'isNoCover' in mesh && !mesh.isNoCover;
    }
</script>

<div bind:this={ref} {...props}></div>
