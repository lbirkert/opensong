<script lang="ts">
	import { faArrowLeft, faBackward } from '@fortawesome/free-solid-svg-icons';
	import SortableList from '../SortableList.svelte';
	import { Icon } from 'svelte-awesome';
	import { openSongState } from '$lib/state.svelte.js';
	import Sidebar from '../Sidebar.svelte';
	import { db } from '$lib/db.js';
	import SongWidget from './SongWidget.svelte';
	import SidebarLoad from '../SidebarLoad.svelte';
	import type { Song } from '$lib/types.js';
	import { text } from '@sveltejs/kit';
	import deepcopy from 'deepcopy';

	let fileInput: HTMLInputElement;
	let files: FileList | undefined = $state();

	$effect(() => {
		if (files !== undefined) {
			Promise.all([...files].map((f) => f.bytes())).then((contents) => {
				openSongState.importFiles.push(...contents);
			});
			fileInput.value = '';
		}
	});

	let songs: Song[] = $state([]);
	async function loadSongs(): Promise<void> {
		const songIds = openSongState.setlist!.songs;
		const tx = (await db.get()).transaction('song', 'readonly');
		songs = (await Promise.all(songIds.map((songId) => tx.store.get(songId)))).filter(
			(song) => song !== undefined
		);
		tx.commit();
	}
	let songsPromise = loadSongs();

	// name might be confusing, only removes from setlist not from library
	async function deleteSong(index: number): Promise<void> {
		songs.splice(index, 1);
		openSongState.setlist!.songs.splice(index, 1);
		const setlist = deepcopy(openSongState.setlist!);
		await (await db.get()).put('setlist', setlist);
	}
</script>

<Sidebar
	onback={() => {
		openSongState.setlist = undefined;
	}}
>
	{#snippet header()}
		{openSongState.setlist!.title}
	{/snippet}

	{#snippet main()}
		{#await songsPromise}
			<SidebarLoad />
		{:then}
			<SortableList
				onrearange={() => {
					// TODO
				}}
				ondelete={deleteSong}
				onclick={() => {
					// TODO
				}}
				length={songs.length}
				itemHeight={80}
			>
				{#snippet item(i)}
					<SongWidget song={songs[i].meta} />
				{/snippet}
			</SortableList>
		{/await}
	{/snippet}
	{#snippet footer()}
		<button
			onclick={() => {
				openSongState.library = true;
			}}
		>
			+ From library
		</button>
		<button
			onclick={() => {
				fileInput.click();
			}}>+ From file</button
		>
	{/snippet}
</Sidebar>

<input type="file" id="file-input" bind:this={fileInput} bind:files multiple />

<style>
	#file-input {
		display: none;
	}
</style>
