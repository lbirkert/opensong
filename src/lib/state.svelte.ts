import type { Setlist } from "./types.js";

class OpenSongState {
    // current import files
    importFiles: Uint8Array[] = $state([]);
    // current import preview
    importPreview: string | undefined = $state();

    // opened setlist
    setlist: Setlist | undefined = $state();

    // whether library is opened
    library: boolean = $state(false);
}

export const openSongState = new OpenSongState();