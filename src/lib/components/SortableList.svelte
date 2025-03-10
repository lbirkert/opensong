<script lang="ts">
	import { faTrash } from '@fortawesome/free-solid-svg-icons';
	import { onMount } from 'svelte';
	import { Icon } from 'svelte-awesome';
	import { press, type PressCustomEvent } from 'svelte-gestures';

	let {
		length,
		itemHeight = 60,
		onrearange = (_, __) => {},
		ondelete = (_) => {},
		onclick = (_) => {},
		active = (_) => false,
		item
	}: {
		length: number;
		itemHeight?: number;
		onrearange?: (index: number, newIndex: number) => void;
		onclick?: (index: number) => void;
		ondelete?: (index: number) => void;
		active?: (index: number) => boolean;
		item(index: number, isDragging: boolean): any;
	} = $props();

	let container: HTMLUListElement;

	type Drag = {
		startY: number;
		index: number;
		pointerId?: number;
	};

	let drag: Drag | undefined = $state();
	let dragDY: number = $state(0);
	let deleteActive: boolean = $derived(getDeleteActive());

	function getDeleteActive() {
		if (drag === undefined) return false;
		const rect = container.getBoundingClientRect();
		const posY = dragDY + drag.index * itemHeight - container.scrollTop + rect.top;
		return posY > rect.bottom - itemHeight;
	}

	function onPress(index: number, event: PressCustomEvent) {
		const startY = event.detail.y + index * itemHeight;
		drag = { startY, index };
		dragDY = 0;
	}

	function onMouseMove(event: MouseEvent) {
		if (drag === undefined) return;
		const rect = container.getBoundingClientRect();
		const mouseY = event.y - rect.y + container.scrollTop;
		dragDY = mouseY - drag.startY;
	}

	function onPointerMove(event: PointerEvent) {
		if (drag === undefined) return;
		if (drag.pointerId === undefined) drag.pointerId = event.pointerId;
		if (drag.pointerId !== event.pointerId) return; // ignore other pointers
		event.preventDefault();
		const rect = container.getBoundingClientRect();
		const pointerY = event.y - rect.y + container.scrollTop;
		dragDY = pointerY - drag.startY;
	}

	function submitDrag() {
		if (drag === undefined) return;

		if(deleteActive) {
			ondelete(drag.index);
			drag = undefined;
			return;
		}

		const indexD = Math.round(dragDY / itemHeight);
		const newIndex = Math.min(length, Math.max(0, drag.index + indexD));

		onrearange(drag.index, newIndex);

		drag = undefined;
	}

	function onMouseUp(event: MouseEvent) {
		submitDrag();
	}

	function onPointerUp(event: PointerEvent) {
		if (drag === undefined) return;
		if (drag.pointerId === event.pointerId) submitDrag();
		else if (drag.pointerId === undefined) submitDrag();
	}

	function getTop(index: number) {
		if (index === drag?.index) {
			return index * itemHeight + dragDY;
		}

		if (drag !== undefined) {
			const rearangeItems = Math.round(dragDY / itemHeight);
			if (
				index > drag.index == rearangeItems > 0 &&
				Math.abs(index - drag.index) <= Math.abs(rearangeItems)
			) {
				return (index + (rearangeItems > 0 ? -1 : 1)) * itemHeight;
			}
		}

		return index * itemHeight;
	}

	onMount(() => {
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('mouseup', onMouseUp);
		window.addEventListener('pointerup', onPointerUp);
	});
</script>

<div class="list">
	<ul class:drag={drag !== undefined} bind:this={container}>
		{#each new Array(length), index}
			{@const isDragging = index === drag?.index}
			{@const isActive = active(index)}
			<button
				use:press={() => ({
					timeframe: 300,
					triggerBeforeFinished: true
				})}
				onclick={() => onclick(index)}
				onpress={(event) => onPress(index, event)}
				style:height="{itemHeight}px"
				style:top="{getTop(index)}px"
				class:dragging={isDragging}
				class:active={isActive}
			>
				{@render item(index, isDragging)}
			</button>
		{/each}
	</ul>
	{#if drag !== undefined}
		<div class="delete row" style:height="{itemHeight}px" class:active={deleteActive}>
			<Icon data={faTrash} />
			Delete
		</div>
	{/if}
</div>

<style>
	.delete {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 40px;
		background-color: var(--color-bg-warn);
		z-index: 1000;
		opacity: 0.3;
		align-items: center;
		justify-content: center;
		color: white;
		user-select: none;
		touch-action: none;
		pointer-events: none;
	}

	.delete.active {
		opacity: 1;
	}

	.list {
		position: relative;
		flex: 1;
		width: 100%;
		height: 100%;
		overflow-x: hidden;
		list-style: none;
		padding: 0;
	}

	ul {
		position: relative;
		width: 100%;
		height: 100%;
		overflow-x: scroll;
		list-style: none;
		padding: 0;
	}

	ul.drag {
		touch-action: none;
		overflow-y: hidden;
	}

	ul.drag button {
		transition: top 0.3s ease;
	}

	button {
		all: unset;
		position: absolute;
		left: 0;
		width: 100%;
		cursor: pointer;
		background-color: var(--color-bg);
		border: none;
	}

	button:active {
		background-color: var(--color-bg-active);
	}

	ul button.dragging {
		z-index: 100;
		transition: none;
		cursor: grabbing;
	}

	button.active {
		background-color: var(--color-bg-active);
	}

	button.dragging {
		background-color: var(--color-bg-secondary);
	}
</style>
