<script>
	import { fade } from "svelte/transition";
	import Spinner from "./Spinner.svelte";
</script>

<div class="loading" in:fade>
    <Spinner scale={1.5}/>
    Loading content...
</div>

<style>
    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        row-gap: 10px;
        height: 100%;
        font-size: 12px;
    }
</style>