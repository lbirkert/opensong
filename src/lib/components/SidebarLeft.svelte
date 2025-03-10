<script lang="ts">
	import { openSongState } from '$lib/state.svelte.js';
	import ImportSheet from './ImportSheet.svelte';
	import Setlists from './setlist/Setlists.svelte';
	import SongLibrary from './song/SongLibrary.svelte';
	import SongView from './song/SongView.svelte';

	let { show = $bindable() }: { show: boolean } = $props();
</script>

<div class="sidebar-left" class:show>
	{#if openSongState.importFiles.length > 0}
		<ImportSheet />
	{:else if openSongState.library}
		<SongLibrary />
	{:else if openSongState.setlist !== undefined}
		<SongView />
	{:else}
		<Setlists />
	{/if}
</div>

<button
	aria-label="return to sheet"
	class="darken"
	class:show
	onclick={() => {
		show = false;
	}}
></button>

<style>
	.darken {
		position: absolute;
		top: 40px;
		left: 0;
		width: 100vw;
		height: calc(100dvh - 40px);
		z-index: 50;
		background-color: rgba(0, 0, 0, 0.2);
		opacity: 0;
		transition: opacity 0.3s ease;
		backdrop-filter: blur(2px);
		pointer-events: none;
		border: none;
		cursor: pointer;
	}

	.darken.show {
		opacity: 1;
		pointer-events: auto;
	}

	.sidebar-left {
		z-index: 200;

		border-top: var(--border0);
		position: absolute;
		top: 40px;
		left: -100%;
		transition: left 0.3s ease;
		display: flex;
		flex-direction: column;
		height: calc(100dvh - 40px);
		max-width: 300px;
		width: 100%;
		background-color: var(--color-bg);

		box-shadow: 12px 12px 18px -6px rgba(0, 0, 0, 0.2);
		-webkit-box-shadow: 12px 12px 18px -6px rgba(0, 0, 0, 0.2);
		-moz-box-shadow: 12px 12px 18px -6px rgba(0, 0, 0, 0.2);
	}

	.sidebar-left.show {
		left: 0;
	}
</style>
