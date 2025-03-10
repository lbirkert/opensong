<script lang="ts">
	import { chordBases } from '$lib/patcher.js';
	import type { SongMeta } from '$lib/types.js';
	import { faMusic } from '@fortawesome/free-solid-svg-icons';
	import { Icon } from 'svelte-awesome';

	let { song }: { song: SongMeta } = $props();

	let key = $derived(chordBases[song.key.index][song.key.flat ? 1 : 0]);

	let description = $derived(
		`${song.author} | in ${key} | ${song.tempo} BMP | ${song.timeSignature}`
	);
</script>

<div class="song">
	<div class="icon">
		<Icon data={faMusic} scale={1.5} />
	</div>
	<div>
		<p class="title">{song.title}</p>
		<p class="description">{description}</p>
	</div>
</div>

<style>
	.song {
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
