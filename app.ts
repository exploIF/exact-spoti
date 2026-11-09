// The data module: answers each source the view declares in app.contract.
import type { Answer, Sources } from './app.contract.d.ts';
import { COLLECTIONS, GENRES, searchTracks, trackById, tracksOfCollection } from './data/catalog';
import { shuffled } from './data/shuffle';

export const grants = '';

const sources: Sources = {
  loadCollections: () => COLLECTIONS,
  loadGenres: () => GENRES,
  loadCollectionTracks: ([id]) => tracksOfCollection(id),
  searchTracks: ([query]) => searchTracks(query),
  loadTracksByIds: ([ids]) => ids.flatMap((id) => trackById(id) ?? []),
  // The current song stays first, so shuffling never interrupts playback.
  shuffleQueue: ([queue, index, seed]) => {
    const current = queue[index];
    return [current, ...shuffled(queue.filter((_, i) => i !== index), seed)];
  },
};

export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
