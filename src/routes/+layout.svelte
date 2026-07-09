<script lang="ts">
	import './layout.css';
	import { onDestroy, onMount, setContext } from 'svelte';
	import { AudioPlayer } from '../lib/index.ts';
	import { Item } from '../example/Item.ts';

	const player = new AudioPlayer<Item>();
	let { children } = $props();

	onMount(async () => {
		await player.init();
	});

	onDestroy(() => {
		player.destroy();
	});

	setContext('player', player);
</script>

{@render children?.()}
