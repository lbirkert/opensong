<script lang="ts">
	import { onMount } from 'svelte';

	let { onfiles }: { onfiles: (file: File[]) => void } = $props();

	let isDragging = $state(false);
	let dragCounter = 0; // Helps track nested drag events

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		dragCounter++;
		isDragging = event.dataTransfer!.types.includes('Files'); // Only trigger for file drag
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault(); // Necessary for the drop event to work
	}

	function handleDragLeave() {
		dragCounter--;
		if (dragCounter === 0) {
			isDragging = false;
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragCounter = 0;

		isDragging = false;

		const files = Array.from(event.dataTransfer!.files);
		console.log('Dropped files:', files);

		onfiles(files);
	}

	// Ensure drag events are bound to the whole window
	onMount(() => {
		window.addEventListener('dragenter', handleDragEnter);
		window.addEventListener('dragover', handleDragOver);
		window.addEventListener('dragleave', handleDragLeave);
		window.addEventListener('drop', handleDrop);
	});
</script>

<div class="dropzone-overlay" class:show={isDragging}>
	<p>Drop your files here!</p>
</div>

<style>
	.dropzone-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		font-size: 1.5rem;
		z-index: 9999;
		pointer-events: none; /* Makes it non-interactable */
		opacity: 0;
		transition: opacity 0.3s;
	}

	.dropzone-overlay.show {
		opacity: 1;
		pointer-events: auto;
	}
</style>
