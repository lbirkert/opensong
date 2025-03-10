import * as mupdfjs from 'mupdf/mupdfjs';

export type Color = mupdfjs.Color;
export type Rect = mupdfjs.Rect;

// TODO: change key to string
export type Key = {
    index: number,
    flat: boolean,
}

export interface SongMeta {
    title: string;
    author: string;
    description: string;
    key: Key;
    tempo?: number;
    timeSignature?: string;
    type: "nashville" | "chords";
    capo: number;
}

export interface Source {
    bytes: ArrayBufferLike;
    patch: Patch;
}

export interface Patch {
    chordPatches: { [key: number]: ChordPatch[] };
    titlePatch: HeaderPatch;
    authorPatch: HeaderPatch;
    descriptionPatch?: HeaderPatch;
    detailPatch?: HeaderPatch; // (Keys + Tempo + Time)
    capoPatch: HeaderPatch;
}

export interface PatchOptions {
    align?: number; // defaults to align left center
    size: number;
    thickness: number; 
    color?: Color; // defaults to black
    font?: string; // defaults to Helvetica
};

export interface HeaderPatch {
    redact: Rect;
    options: PatchOptions;
}

export interface ChordPatch {
    redact: Rect;
    options: PatchOptions; // these are global
    chordFn: string;
}

export interface Song {
    id?: number;
    sourceId: number;
    meta: SongMeta;
    //  notes: Note[];
}

export interface Setlist {
    id?: number;
    title: string;
    description: string;
    author: String;
    songs: number[];
    createdAt: number;
    updatedAt: number;
}

export const ALIGN_LEFT_CENTER = 0;
export const ALIGN_RIGHT_CENTER = 1;