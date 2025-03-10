<script lang="ts">
	import { db } from '$lib/db.js';
	import type { Setlist } from '$lib/types.js';
	import Sidebar from '../Sidebar.svelte';

	let { onback } = $props();

	let title: string = $state('');
	let description: string = $state('');
	let author: string = $state('');
	let date = new Date();

	async function createSetlist() {
		const setlist: Setlist = {
			title,
			description,
			author,
			songs: [],
			createdAt: date.getTime(),
			updatedAt: date.getTime(),
		};

		setlist.id = await (await db.get()).add('setlist', setlist);
		
		onback();

		// TODO: enter setlist
	}
</script>

<Sidebar {onback}>
	{#snippet header()}
		Create Setlist
	{/snippet}
	{#snippet main()}
		<form>
			<label>
				Title
				<input type="text" placeholder="Enter name" bind:value={title} />
			</label>
			<label>
				Description
				<input type="text" placeholder="Enter name" bind:value={description} />
			</label>
			<label>
				Author
				<input type="text" placeholder="Enter author" bind:value={author} />
			</label>
			<label>
				Date
				<input type="text" placeholder="Enter author" value={date} disabled />
			</label>
		</form>
	{/snippet}
	{#snippet footer()}
		<span></span>
		<button onclick={createSetlist}>+ Create Setlist</button>
	{/snippet}
</Sidebar>
