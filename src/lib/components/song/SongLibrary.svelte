<script lang="ts">
	import { db } from '$lib/db.js';
	import { openSongState } from '$lib/state.svelte.js';
	import type { Song } from '$lib/types.js';
	import { faL } from '@fortawesome/free-solid-svg-icons';
	import Sidebar from '../Sidebar.svelte';
	import SidebarLoad from '../SidebarLoad.svelte';
	import SortableList from '../SortableList.svelte';
	import SongWidget from './SongWidget.svelte';
	import deepcopy from 'deepcopy';

	let songs: Song[] = $state(undefined!);
	async function loadSongs(): Promise<void> {
		songs = await (await db.get()).getAll('song');
	}
	let songsPromise = loadSongs();

	async function deleteSong(index: number) {
		const [song] = songs.splice(index, 1);
		await (await db.get()).delete('song', song.id!);
		// TODO: also delete song from setlists
	}

	async function clickSong(index: number) {
		if (openSongState.setlist !== undefined) {
			// Add to setlist
			openSongState.setlist.songs.push(songs[index].id!);
			const setlist = deepcopy(openSongState.setlist);
			await (await db.get()).put('setlist', setlist);

            // Close library
            openSongState.library = false;
		}
	}
</script>

<Sidebar
	onback={() => {
		openSongState.library = false;
	}}
>
	{#snippet header()}
		Song Library
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
				onclick={clickSong}
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
		<!-- TODO: check whether these make sense -->
		<span></span>
		<button>+ Import</button>
	{/snippet}
</Sidebar>
