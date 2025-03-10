<script>
	import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
	import { Icon } from "svelte-awesome";

    let {
        header,
        main,
        footer,
        onback = undefined
    } = $props();
</script>

<header>
    {#if onback !== undefined}
    <button onclick={onback}>
        <Icon data={faArrowLeft}/>
    </button>
    {/if}

    {@render header()}
</header>

<main>
    {@render main()}
</main>

<footer>
    {@render footer()}
</footer>

<style>
    main {
        flex: 1;
		overflow-y: scroll;
    }

	header {
		font-weight: 600;
		width: 100%;
		height: 40px;
		border-bottom: var(--border0);
		display: flex;
		align-items: center;
		column-gap: 20px;
		padding: 10px 20px;
	}

	header :global(button) {
		background-color: transparent;
		display: flex;
		border: none;
		padding: 0;
		color: var(--color-accent);
		cursor: pointer;
	}

	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: var(--border0);
		width: 100%;
		height: 40px;
		padding: 10px 20px;
	}

	footer :global(button) {
		background: transparent;
		border: none;
		color: var(--color-accent);
		cursor: pointer;
	}
</style>