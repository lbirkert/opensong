<script lang="ts">
	import Sidebar from '../Sidebar.svelte';
	import SortableList from '../SortableList.svelte';
	import SetlistWidget from './SetlistWidget.svelte';
	import { db } from '$lib/db.js';
	import { openSongState } from '$lib/state.svelte.js';
	import SidebarLoad from '../SidebarLoad.svelte';
	import type { Setlist } from '$lib/types.js';

	const { oncreate } = $props();

	let setlists: Setlist[] = $state(undefined!);
	async function loadSetlists(): Promise<void> {
		setlists = await (await db.get()).getAll('setlist');
	}
	let setlistsPromise = loadSetlists();

	async function deleteSetlist(index: number) {
		const [ setlist ] = setlists.splice(index, 1);
		await (await db.get()).delete('setlist', setlist.id!);
	}
</script>

<Sidebar>
	{#snippet header()}
		View Setlists
	{/snippet}
	{#snippet main()}
		{#await setlistsPromise}
			<SidebarLoad />
		{:then}
			<SortableList
				length={setlists.length}
				onrearange={(index, newIndex) => {
					// TODO:
				}}
				onclick={(index) => {
					openSongState.setlist = setlists[index];
				}}
				ondelete={deleteSetlist}
				itemHeight={80}
			>
				{#snippet item(i)}
					<SetlistWidget setlist={setlists[i]} />
				{/snippet}
			</SortableList>
		{/await}
	{/snippet}
	{#snippet footer()}
		<span></span>
		<button onclick={oncreate}>+ Create</button>
	{/snippet}
</Sidebar>
