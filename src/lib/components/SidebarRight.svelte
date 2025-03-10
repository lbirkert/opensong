<script lang="ts">
    let { show }: { show: boolean } = $props();
</script>

<div class="sidebar-right" class:show>
</div>

<style>
	.sidebar-right {
        position: absolute;
        top: 40px;
        right: -100%;
        transition: right 0.3s ease;
        display: flex;
        flex-direction: column;
        height: calc(100dvh - 40px);
        max-width: 400px;
        width: 100%;
        background-color: var(--color-bg);
        border-top: var(--border0);
		box-shadow: -12px 0px 33px 6px rgba(0, 0, 0, 0.2);
		-webkit-box-shadow: -12px 0px 33px 6px rgba(0, 0, 0, 0.2);
		-moz-box-shadow: -12px 0px 33px 6px rgba(0, 0, 0, 0.2);
	}

    .sidebar-right.show {
        right: 0;
    }
</style>
