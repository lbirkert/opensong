<script lang="ts">
    let { src }: { src: string } = $props();
</script>

<div class="sheet">
    <iframe src={src} title=''></iframe>
</div>

<style>
    .sheet {
        height: calc(100dvh - 40px);
        width: 100vw;
    }
</style>