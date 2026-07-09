<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import type { LyricPlayer as AMLLLyricsPlayer, LayoutAlignAnchor, LyricLine, LyricLineMouseEventListener, MaskObsceneWordsMode, OptimizeLyricOptions, spring } from '@applemusic-like-lyrics/core';
    import { onDestroy, onMount, untrack } from 'svelte';

    let {
        ref = $bindable(null),
        player = $bindable(null),
        lines,
        currentTime,
        playing,
        hidePassedLines = false,
        enableScale = true,
        enableBlur = true,
        enableSpring = true,
        alignAnchor = 'top',
        setAlignPosition = 0.5,
        isSeeking = false,
        maskObsceneWordChar = '*',
        maskObsceneWords = 'partial-mask',
        overscanPx = 300,
        wordFadeWidthPx,
        optimizeOptions = {},
        linePosYSpringParams,
        linePosScaleSpringParams,
        linePosXSpringParams,
        onLineClick,
        ...props
    }: {
        ref?: HTMLDivElement|null;
        player?: AMLLLyricsPlayer|null;
        lines: LyricLine[];
        /**
         * Current time in milliseconds
        */
        currentTime: number;
        playing: boolean;
        hidePassedLines?: boolean;
        enableScale?: boolean;
        enableBlur?: boolean;
        enableSpring?: boolean;
        alignAnchor?: LayoutAlignAnchor;
        setAlignPosition?: number;
        isSeeking?: boolean;
        maskObsceneWordChar?: string;
        maskObsceneWords?: MaskObsceneWordsMode;
        overscanPx?: number;
        wordFadeWidthPx?: number;
        optimizeOptions?: OptimizeLyricOptions;
        linePosYSpringParams?: Partial<spring.SpringParams>;
        linePosScaleSpringParams?: Partial<spring.SpringParams>;
        /**
         * @deprecated
         */
        linePosXSpringParams?: Partial<spring.SpringParams>;
        onLineClick?: LyricLineMouseEventListener;
    } & HTMLAttributes<HTMLDivElement> = $props();

    let lastFrameTime = -1;
    let frameId = -1;

    onMount(async () => {
        const { LyricPlayer } = await import('@applemusic-like-lyrics/core');

        player ??= new LyricPlayer();

        player.setLyricLines(lines, currentTime);
        player.setCurrentTime(currentTime);

        if (onLineClick) {
            player.addEventListener('line-click', onLineClick as () => void);
        }

        requestAnimationFrame(onFrame);
    });

    onDestroy(() => {
        if (frameId > -1) {
            cancelAnimationFrame(frameId);
        }

        if (onLineClick) {
            player?.removeEventListener('line-click', onLineClick as () => void);
        }

        player?.dispose();
    });

    $effect(() => {
        if (!player || !ref) return;

        ref.appendChild(player.getElement());
    });

    $effect(() => {
        if (!player) return;

        player.setLyricLines(lines, untrack(() => currentTime));
    });

    $effect(() => {
        if (!player) return;

        player.setCurrentTime(currentTime);
    });

    $effect(() => {
        if (!player) return;

        if (playing) {
            player.resume();
        } else {
            player.pause();
        }

        player.setHidePassedLines(hidePassedLines);
        player.setAlignAnchor(alignAnchor);
        player.setAlignPosition(setAlignPosition ?? (alignAnchor === 'top' ? 0.05 : 0.45));
        player.setEnableScale(enableScale);
        player.setEnableBlur(enableBlur);
        player.setEnableSpring(enableSpring);
        player.setIsSeeking(isSeeking);
        player.setMaskObsceneWordChar(maskObsceneWordChar);
        player.setMaskObsceneWords(maskObsceneWords);
        player.setOverscanPx(overscanPx);
        player.setWordFadeWidth(wordFadeWidthPx);
        player.setOptimizeOptions(optimizeOptions);
        player.setLinePosYSpringParams(linePosYSpringParams);
        player.setLinePosXSpringParams(linePosXSpringParams);
        player.setLineScaleSpringParams(linePosScaleSpringParams);
    });

    function onFrame(frameTime: number) {
        const delta = lastFrameTime === -1 ? 0 : frameTime - lastFrameTime;

        lastFrameTime = frameTime;

        player?.update(delta);

        requestAnimationFrame(onFrame);
    }
</script>

<div
    bind:this={ref}
    {...props}
></div>