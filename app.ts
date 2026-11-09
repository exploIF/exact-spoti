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
  // Tells the iOS tab bar accessory what is playing. `active` says the native bar is in use.
  syncPlayerBar: ([hasTrack, title, artist, cover, isPlaying], _store, _storage, native) => {
    if (!native?.available) return { active: false };
    try {
      return native.call({ op: 'update', hasTrack, title, artist, cover, isPlaying }) as { active: boolean };
    } catch {
      return { active: false };
    }
  },
  // The current song stays first, so shuffling never interrupts playback.
  shuffleQueue: ([queue, index, seed]) => {
    const current = queue[index];
    return [current, ...shuffled(queue.filter((_, i) => i !== index), seed)];
  },
};

export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
