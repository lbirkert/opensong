<script>
	import { faSpinner } from "@fortawesome/free-solid-svg-icons";
	import { Icon } from "svelte-awesome";

    let { scale = 2 } = $props();
</script>

<div class="spinner">
    <Icon data={faSpinner} {scale} />
</div>

<style>
    .spinner :global(svg) {
        animation: rotate linear 1s infinite;
    }

    @keyframes rotate {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>