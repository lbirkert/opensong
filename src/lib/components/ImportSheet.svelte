<script lang="ts">
	import { faArrowLeft, faBackward } from '@fortawesome/free-solid-svg-icons';
	import { Icon } from 'svelte-awesome';
	import { openSongState } from '$lib/state.svelte.js';
	import { analyzeSheet, patch } from '$lib/sheet.js';
	import { onDestroy } from 'svelte';
	import KeySelector from './KeySelector.svelte';
	import { db } from '$lib/db.js';
	import type { Song } from '$lib/types.js';
	import deepcopy from 'deepcopy';
	import Sidebar from './Sidebar.svelte';

	const [source, meta] = $derived(analyzeSheet(openSongState.importFiles[0]));

	let timeoutId: number | undefined;

	$effect(() => {
		if (timeoutId !== undefined) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			if (openSongState.importPreview !== undefined) {
				return;
				URL.revokeObjectURL(openSongState.importPreview!);
			}
			const bytes = patch(source, meta);
			openSongState.importPreview = URL.createObjectURL(
				new Blob([bytes], { type: 'application/pdf' })
			);
		}, 1000);
	});

	onDestroy(() => {
		if (openSongState.importPreview !== undefined) {
			URL.revokeObjectURL(openSongState.importPreview);
			openSongState.importPreview = undefined;
		}
	});

	async function addSong() {
		const sourceId = await (await db.get()).add('source', source);
		// need to deep copy meta to not get issues with $state
		const song: Song = { sourceId, meta: deepcopy(meta) };
		const songId = await (await db.get()).add('song', song);
		console.log('Added song with id:', songId);
		return songId;
	}

	async function addToLibrary() {
		await addSong();
		openSongState.importFiles.shift();
	}

	async function addToSetlist() {
		const songId = await addSong();
		openSongState.setlist!.songs.push(songId);
		const setlist = deepcopy(openSongState.setlist!);
		await (await db.get()).put('setlist', setlist);
		openSongState.importFiles.shift();
	}
</script>

<Sidebar
	onback={() => {
		openSongState.importFiles = [];
	}}
>
	{#snippet header()}
		Import Sheet
	{/snippet}
	{#snippet main()}
		<form>
			<label>
				Title
				<input type="text" placeholder="Title" bind:value={meta.title} />
			</label>
			<label>
				Author
				<input type="text" placeholder="Author" bind:value={meta.author} />
			</label>
			<label>
				Description
				<input type="text" placeholder="Description" bind:value={meta.description} />
			</label>
			<div class="row">
				<label>
					Tempo
					<input type="number" placeholder="Tempo" bind:value={meta.tempo} />
				</label>
				<label>
					Time signature
					<input type="text" placeholder="Time" bind:value={meta.timeSignature} />
				</label>
			</div>
			<label>
				Key
				<KeySelector index={meta.key.index} flat={meta.key.flat} />
			</label>
		</form>
	{/snippet}
	{#snippet footer()}
		<button onclick={addToLibrary}>+ Add to library</button>
		{#if openSongState.setlist !== undefined}
			<button onclick={addToSetlist}>+ Add to setlist</button>
		{/if}
	{/snippet}
</Sidebar>