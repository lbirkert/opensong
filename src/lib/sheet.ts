
// This file is for patching & analyzing songsheets

import type { PDFPage } from 'mupdf';
import * as mupdfjs from 'mupdf/mupdfjs';
import { type Source, type HeaderPatch, ALIGN_LEFT_CENTER, ALIGN_RIGHT_CENTER, type ChordPatch, type Patch, type SongMeta, type PatchOptions, type Key } from './types.js';

export const chordBases = [
    ['C', 'C'],
    ['C#', 'Db', 'Cis', 'Des'],
    ['D', 'D'],
    ['D#', 'Eb', 'Dis', 'Es'],
    ['E', 'E'],
    ['F', 'F'],
    ['F#', 'Gb', 'Fis', 'Ges'],
    ['G', 'G'],
    ['G#', 'Ab', 'Gis', 'As'],
    ['A', 'A'],
    ['A#', 'Bb', 'Ais', 'Bes'],
    ['B', 'B', 'H'],
];

export const chordBasesNashvile = [
    ['1'],
    ['#1', 'b2'],
    ['2'],
    ['#2', 'b3'],
    ['3'],
    ['4'],
    ['#4', 'b5'],
    ['5'],
    ['#5', 'b6'],
    ['6'],
    ['#6', 'b7'],
    ['7']
];

export const wordsKey = [
    'Tonart', 'Key'
];

export const wordsTempo = [
    'Tempo'
];

export const wordsTimeSignature = [
    'Time', 'Taktart'
];


// get index of base note
export function getBaseIdx(base: string, bases: string[][]) {
    for (let i = 0; i < bases.length; i++) {
        if (bases[i].includes(base)) return i;
    }

    throw Error(`Invalid base note! ${base}`);
}

// convert chord in nashvile form to the appropriate key
export function convertChord(text: string, key: string): string | undefined {
    const key_idx = getBaseIdx(key, chordBases);

    // 1. Step, check root
    const root = chordBasesNashvile.flat().find((base) => text.startsWith(base));
    if (!root) {
        return undefined;
    }
    const root_idx = getBaseIdx(root, chordBasesNashvile);
    const croot = chordBases[(root_idx + key_idx) % chordBases.length][0]; // TODO: maybe don't take the 1st always
    text = text.substring(root.length);

    // 2. Step, get inversion
    const inversion = chordBasesNashvile.flat().find((base) => text.startsWith('/' + base));
    let cinversion = '';
    if (inversion) {
        const inversion_idx = getBaseIdx(inversion, chordBasesNashvile);
        text = text.substring(0, text.length - inversion.length - 1);
        cinversion = '/' + chordBases[(inversion_idx + key_idx) % chordBases.length][0]; // TODO: same here
    }

    // TODO: 3. Step => extensions

    return croot + text + cinversion;
}

export function isNashvile(text: string): boolean {
    return convertChord(text, 'C') !== undefined;
}

export type PDFWord = {
    rect: mupdfjs.Rect,
    text: string,
    font: mupdfjs.Font,
    size: number,
};

// Get the words of the page
export function getWords(page: PDFPage): PDFWord[] {
    const words: PDFWord[] = [];
    let cwordRect: mupdfjs.Rect | undefined;
    let cwordFont: mupdfjs.Font | undefined;
    let cwordSize: number | undefined;
    let cwordText = '';

    const endWord = () => {
        // If word is complete, append to list
        if (
            cwordRect !== undefined &&
            cwordFont !== undefined &&
            cwordSize !== undefined &&
            cwordText !== ''
        ) {
            words.push({
                rect: cwordRect,
                text: cwordText,
                font: cwordFont,
                size: cwordSize,
            });
        }

        // Reset values
        cwordRect = undefined;
        cwordFont = undefined;
        cwordSize = undefined;
        cwordText = '';
    };

    const enlargeRect = ([x0, y0, _, __, ___, ____, x1, y1]: number[]) => {
        if (cwordRect === undefined) {
            return cwordRect = [x0, y0, x1, y1];
        }

        cwordRect[0] = Math.min(cwordRect[0], x0);
        cwordRect[1] = Math.min(cwordRect[1], y0);
        cwordRect[2] = Math.max(cwordRect[2], x1);
        cwordRect[3] = Math.max(cwordRect[3], y1);
    }

    page.toStructuredText('').walk({
        onChar(c, _origin, font, size, quad) {
            enlargeRect(quad);

            cwordFont = font;
            cwordSize = size;

            if (c == ' ') {
                endWord();
            } else {
                cwordText += c;
            }
        },
        endLine: endWord,
    });

    return words;
}

export type PDFLine = {
    rect: mupdfjs.Rect,
    text: string,
};

// Get the lines
export function getLines(words: PDFWord[]): PDFLine[] {
    const EPSILON = 2;

    const sorted = words.toSorted((a, b) => {
        return a.rect[3] - b.rect[3];
    });

    const lines: PDFLine[] = [];

    let lineWords: PDFWord[] = [];
    let lineRect: mupdfjs.Rect | undefined;
    let lastY;

    const enlargeRect = (wordRect: mupdfjs.Rect) => {
        if (lineRect === undefined) {
            return lineRect = [...wordRect];
        }

        lineRect[0] = Math.min(lineRect[0], wordRect[0]);
        lineRect[1] = Math.min(lineRect[1], wordRect[1]);
        lineRect[2] = Math.max(lineRect[2], wordRect[2]);
        lineRect[3] = Math.max(lineRect[3], wordRect[3]);
    }

    for (const word of sorted) {
        if (lastY !== undefined &&
            Math.abs(word.rect[3] - lastY) > EPSILON) {
            lineWords.sort((a, b) => {
                return a.rect[0] - b.rect[0];
            });
            const text = lineWords.map((w) => w.text).join(' ');
            lines.push({
                rect: lineRect!,
                text
            });
            lineWords = [];
            lineRect = undefined;
        }
        lineWords.push(word);
        enlargeRect(word.rect);
        lastY = word.rect[3];
    }

    return lines;
}

function isValidLatinString(str: string): boolean {
    return /^[A-Za-z0-9 !"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~äöüÄÖÜß]*$/.test(str);
}

// extract data from a sheet (TODO: add ability to hint a key)
export function analyzeSheet(contents: Uint8Array): [Source, SongMeta] {
    const doc: mupdfjs.PDFDocument = mupdfjs.PDFDocument.openDocument(contents, 'application/pdf');

    let titlePatch: HeaderPatch = undefined!;
    let capoPatch: HeaderPatch = undefined!;
    let authorPatch: HeaderPatch = undefined!;
    let descriptionPatch: HeaderPatch | undefined;
    let detailPatch: HeaderPatch | undefined;
    let chordPatches: { [page: number]: ChordPatch[] } = {};

    let title: string = undefined!;
    let author: string = '';
    let description: string = '';

    let key: Key | undefined;
    let timeSignature: string | undefined;
    let tempo: number | undefined;

    for (let pageIdx = 0; pageIdx < doc.countPages(); pageIdx++) {
        const page = new mupdfjs.PDFPage(doc, pageIdx);
        const words = getWords(page);

        const textData = words.map((w) => w.text);

        if (pageIdx === 0) {
            const lines = getLines(words)
                // filter giberish
                .filter((l) => isValidLatinString(l.text));

            console.log(lines);

            // title line is always the 1st
            const titleLineIdx = 0;
            const titleLine = lines[titleLineIdx];
            title = titleLine.text;

            // find detail line
            let detailLine: PDFLine | undefined;
            let detailLineIdx: number | undefined;
            for (let lineIdx = titleLineIdx; lineIdx < lines.length; lineIdx++) {
                const line = lines[lineIdx];
                const lineWords = line.text.split(' ').reverse();
                while (true) {
                    if (lineWords.length == 0) {
                        detailLine = line;
                        detailLineIdx = lineIdx;
                        break;
                    }

                    const wordKey = lineWords.pop()!;
                    lineWords.pop();
                    const wordValue = lineWords.pop();
                    lineWords.pop();
                    if (wordValue === undefined) break;
                    if (wordsKey.includes(wordKey)) {
                        // TODO: quintenzirkel
                        const converted = chordBases
                            .map((e, i) => [e, i] as [string[], number])
                            .find(([e, _]) => e.includes(wordValue!));
                        if (converted !== undefined) {
                            const keyIdx = converted[1];
                            const flatSharp = (converted[0].indexOf(wordValue) % 2) != 0;
                            key = {
                                index: keyIdx,
                                flat: flatSharp
                            };
                        }
                    } else if (wordsTempo.includes(wordKey)) {
                        tempo = parseInt(wordValue);
                    } else if (wordsTimeSignature.includes(wordKey)) {
                        timeSignature = wordValue;
                    } else break;
                }

                if (detailLineIdx !== undefined) break;
            }

            let authorLine: PDFLine | undefined;
            let descriptionLine: PDFLine | undefined;

            if (detailLineIdx !== undefined) {
                if (detailLineIdx > 1) {
                    // only author
                    authorLine = lines[1];
                    author = authorLine.text;
                }

                if (detailLineIdx > 2) {
                    // author + description
                    descriptionLine = lines[2];
                    description = descriptionLine.text;
                }
            }

            titlePatch = {
                redact: titleLine.rect,
                options: { size: 16, thickness: 0.8, font: 'Helvetica-Bold' }
            };
            authorPatch = {
                redact: authorLine ? authorLine.rect :
                    [
                        titleLine.rect[0],
                        titleLine.rect[3],
                        titleLine.rect[0],
                        titleLine.rect[3],
                    ]
                ,
                options: { size: 7, thickness: 0.1, }
            };
            descriptionPatch = descriptionLine ? {
                redact: descriptionLine.rect,
                options: { size: 7, thickness: 0.1, }
            } : undefined;
            detailPatch = detailLine ? {
                redact: detailLine.rect,
                options: { size: 9, thickness: 0.6, }
            } : undefined;

            // place capo patch at top right corner
            const [_, px1, __, py1] = page.getBounds();
            const capoX = px1 - 20, capoY = py1 + 20;

            capoPatch = {
                redact: [capoX, capoY, capoX, capoY],
                options: {
                    align: ALIGN_RIGHT_CENTER,
                    size: 14,
                    thickness: 1,
                }
            };
        }

        // find chord section
        let chord_start = 0;
        let chord_end = words.length;
        let last_y = 0;
        for (const word of words) {
            const curr_y = word.rect[3];
            if (curr_y < last_y) {
                break;
            }
            chord_start += 1;
            last_y = curr_y;
        }

        // get chord patches
        chordPatches[pageIdx] = [];
        for (let i = chord_start; i < chord_end; i++) {
            const { rect, text } = words[i];

            if (!isNashvile(text)) continue;

            chordPatches[pageIdx].push({
                redact: rect,
                chordFn: text, // TODO: fix this
                options: {
                    thickness: 1,
                    size: 12,
                }
            });
        }

        page.destroy();
    }

    doc.destroy();

    const patch: Patch = {
        titlePatch,
        authorPatch,
        descriptionPatch,
        detailPatch,
        capoPatch,
        chordPatches,
    };

    const meta: SongMeta = {
        title,
        author,
        description,
        tempo,
        timeSignature,
        key: key ?? {
            index: 0,
            flat: false,
        }, // use C as default
        type: 'nashville',
        capo: 0,
    };

    return [
        {
            bytes: contents.buffer,
            patch,
        }, meta
    ];
}

export function applyPatch(
    page: mupdfjs.PDFPage,
    redact: mupdfjs.Rect,
    options: PatchOptions,
    text: string,
) {
    //console.log('REDACTING', redact);
    const [x, y, x1, y1] = redact;
    let textX: number;
    let textY: number;

    switch (options.align ?? ALIGN_LEFT_CENTER) {
        case ALIGN_LEFT_CENTER:
            textX = x;
            textY = (y + y1 - options.size) * 0.5 - 2;
            break;
        case ALIGN_RIGHT_CENTER:
            textX = x - options.size * text.length;
            textY = (y + y1 - options.size) * 0.5;
            break;
        default:
            throw Error();
    }

    const width = x1 - x, height = y1 - y;
    page.addRedaction({
        x, y, width, height
    });
    page.applyRedactions(false);
    const color = options.color ?? [0, 0, 0]
    page.insertText(text, [textX, textY], options.font ?? 'Helvetica', options.size, {
        strokeColor: color,
        fillColor: color,
        strokeThickness: options.thickness,
    });
}

export function patch(source: Source, meta: SongMeta): Uint8Array {
    const doc: mupdfjs.PDFDocument = mupdfjs.PDFDocument.openDocument(
        new Uint8Array(source.bytes), 'application/pdf');

    for (let pageIdx = 0; pageIdx < doc.countPages(); pageIdx++) {
        const page = new mupdfjs.PDFPage(doc, pageIdx);

        const {
            patch: {
                titlePatch,
                authorPatch,
                detailPatch,
                descriptionPatch,
                // TODO: capo patch, chord patches
            }
        } = source;

        if (pageIdx == 0) {
            applyPatch(page, titlePatch.redact, titlePatch.options, meta.title);
            applyPatch(page, authorPatch.redact, authorPatch.options, meta.author);
            const detail = `Key - | Tempo - | Time - `;
            if (detailPatch) applyPatch(page, detailPatch.redact, detailPatch.options, detail);
            if (descriptionPatch) applyPatch(page, descriptionPatch.redact, descriptionPatch.options, meta.description);
        }

        // TODO
        page.destroy();
    }

    doc.bake();
    const result = doc.saveToBuffer().asUint8Array();
    doc.destroy();
    return result;
}

export function overwriteChords(contents: Uint8Array, key: string): Uint8Array {
    const doc: mupdfjs.PDFDocument = mupdfjs.PDFDocument.openDocument(contents, 'application/pdf');

    for (let pageIdx = 0; pageIdx < doc.countPages(); pageIdx++) {
        const page = new mupdfjs.PDFPage(doc, pageIdx);
        const words = getWords(page);

        if (pageIdx == 0) {
        }

        // find chord section
        let last_y = 0;
        let end_section = 0;
        for (const word of words) {
            const curr_y = word.rect[3];
            if (curr_y < last_y) {
                break;
            }
            end_section += 1;
            last_y = curr_y;
        }

        console.log(words.slice(end_section).map(w => w.text));

        // convert the chords and overwrite them
        for (let i = end_section; i < words.length; i++) {
            const { rect: [x0, y0, x1, y1], text } = words[i];

            const new_chord = convertChord(text, key);
            if (new_chord == null) {
                continue;
            }

            const width = x1 - x0, height = y1 - y0;

            page.addRedaction({ x: x0, y: y0, width, height });
            page.applyRedactions(false);

            const fontSize = 11;
            const padding = 2;
            const color: [number, number, number] = [0, 0, 0];
            page.insertText(new_chord, [x0, y1 - fontSize - padding], 'Helvetica', fontSize, {
                strokeThickness: 0.5, fillColor: color, strokeColor: color,
            });
        }

        page.destroy();
    }

    const result = doc.saveToBuffer().asUint8Array();
    doc.destroy();
    return result;
}