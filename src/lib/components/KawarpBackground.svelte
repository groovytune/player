<script lang="ts">
    import Kawarp, { type KawarpOptions } from '@kawarp/core';
    import type { HTMLAttributes } from 'svelte/elements';

    let {
        ref = $bindable(null),
        loaded = $bindable(false),
        image,
        warpIntensity,
        blurPasses,
        animationSpeed,
        transitionDuration,
        saturation,
        tintColor,
        tintIntensity,
        dithering,
        scale,
        ...props
    }: {
        ref?: HTMLCanvasElement|null;
        image: string;
        class?: string;
        loaded?: boolean;
    } & KawarpOptions & HTMLAttributes<HTMLCanvasElement> = $props();

    let renderer: Kawarp|null = $state(null);

    $effect(() => {
        if (!ref) return;

        renderer = new Kawarp(ref,  {
            warpIntensity,
            blurPasses,
            animationSpeed,
            transitionDuration,
            saturation,
            tintColor,
            tintIntensity,
            dithering,
            scale
        });

        return () => {
            renderer?.dispose();
            renderer = null;
        };
    });

    $effect(() => {
        if (!renderer) return;

        loaded = false;

        renderer
            .loadImage(image)
            .then(() => {
                loaded = true;
                renderer?.start();
            })
            .catch(() => loaded = false);
    });
</script>

<svelte:window onresize={() => renderer?.resize()}/>
<canvas bind:this={ref} {...props}></canvas>
