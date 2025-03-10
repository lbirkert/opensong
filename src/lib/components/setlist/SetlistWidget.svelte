<script lang="ts">
	import type { Setlist } from '$lib/types.js';
	import { faList } from '@fortawesome/free-solid-svg-icons';
	import { Icon } from 'svelte-awesome';

	let { setlist }: { setlist: Setlist } = $props();
</script>

<div class="setlist">
	<div class="icon">
		<Icon data={faList} scale={1.5} />
	</div>
	<div class="detail">
		<p class="title">{setlist.title}</p>
		<p class="description">{setlist.description}</p>
	</div>
</div>

<style>
	.setlist {
		padding: 0 20px;
		height: 100%;
		display: flex;
		flex-direction: row;
		column-gap: 20px;
		align-items: center;
	}

	.title {
		font-weight: 600;
		font-size: 16px;
	}

	.description {
		font-size: 11px;
	}
</style>
