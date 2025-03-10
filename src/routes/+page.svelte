<script lang="ts">
	import Sidebar from '$lib/components/SidebarLeft.svelte';
	import FileDragNDrop from '$lib/components/FileDragNDrop.svelte';

	import { overwriteChords } from '$lib/patcher.js';
	import Theme from '$lib/components/Theme.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import SongsSidebar from '$lib/components/SidebarLeft.svelte';
	import SongSettingsSidebar from '$lib/components/SidebarRight.svelte';
	import { onMount } from 'svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { openSongState } from '$lib/state.svelte.js';

	let files: File[] | undefined = $state();

	let key: string = $state('C');

	let objectUrl: string | undefined = $state();

	let showLeft: boolean = $state(true);
	let showRight: boolean = $state(false);

	$effect(() => {
		console.log(key);

		if (files) {
			(async () => {
				const bytes = await files[0]!.bytes();
				console.log(bytes.length, bytes);
				const newPDF = overwriteChords(bytes, key);
				if(objectUrl) {
					URL.revokeObjectURL(objectUrl);
				}
				objectUrl = URL.createObjectURL(new Blob([newPDF], { type: 'application/pdf' }));
				console.log('finished');
			})();

			for (const file of files) {
				console.log(`${file.name}: ${file.size} bytes`);
			}
		}
	});

	let show = $state(false);
	onMount(async () => {
		await document.fonts.ready;
		show = true;
	});
</script>

<Theme/>

<FileDragNDrop onfiles={(files_) => files = files_}/>

<main class:show>
	<!--<header>
		<select bind:value={key}>
			<option value="C">C</option>
			<option value="C#">C#</option>
			<option value="D">D</option>
			<option value="D#">D#</option>
			<option value="E">E</option>
			<option value="F">F</option>
			<option value="F#">F#</option>
			<option value="G">G</option>
			<option value="G#">G#</option>
			<option value="A">A</option>
			<option value="A#">A#</option>
			<option value="B">B</option>
		</select>
	</header>
-->


	<Navbar bind:showLeft bind:showRight/>
	<SongsSidebar bind:show={showLeft}/>
	<SongSettingsSidebar show={showRight}/>

	<div class="body">
		<div class="sheet">
			{#if openSongState.importPreview}
				<iframe src={openSongState.importPreview} title="PDF"></iframe>
			{/if}
		</div>
	</div>
</main>

<div class="spinner-overlay" class:hide={show}>
		<Spinner/>
		Loading OpenSong
</div>

<style>
	main {
		height: 100%;
		display: flex;
		flex-direction: column;
		transform: scale(1.05);
		transition: transform 0.6s ease;
	}

	main.show {
		transform: none;
	}

	.spinner-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100dvh;
		background-color: white;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		row-gap: 20px;
		align-items: center;
		justify-content: center;
		transition: opacity 0.6s ease;
	}

	.spinner-overlay.hide {
		pointer-events: none;
		opacity: 0;
	}

	.body {
		width: 100%;
		flex: 1;
		display: flex;
		align-items: stretch;
		justify-content: stretch;
	}

	.sheet {
		flex: 1;
	}

	iframe {
		width: 100%;
		height: 100%;
	}
</style>
