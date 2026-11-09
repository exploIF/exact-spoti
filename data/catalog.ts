// The music catalog. Everything is generated from small word lists, so the app
// has thousands of rows to scroll and search with no backend. The only real
// media is the 16 SoundHelix demo files, which every track cycles through.

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  url: string;
  duration: number;
};

export type Collection = {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  cover: string;
  trackCount: number;
};

/** Seconds per demo file, derived from its size at 192 kbps. */
const DEMO_DURATIONS = [
  372, 425, 344, 302, 353, 279, 420, 325, 389, 527, 551, 513, 470, 516, 438, 483,
];

const COVER_COUNT = 24;
export const LARGE_LIBRARY_ID = 'everything';
const LARGE_LIBRARY_SIZE = 5000;
const TRACKS_PER_PLAYLIST = 24;

const ADJECTIVES = ['Velvet', 'Neon', 'Paper', 'Golden', 'Silent', 'Electric', 'Midnight', 'Crystal', 'Wandering', 'Hollow', 'Amber', 'Distant'];
const NOUNS = ['Rivers', 'Horizons', 'Signals', 'Gardens', 'Echoes', 'Satellites', 'Lanterns', 'Tides', 'Mirrors', 'Comets', 'Meadows', 'Engines'];
const ARTIST_FIRST = ['Luna', 'Orbit', 'Cedar', 'Nova', 'Marlow', 'Kite', 'Juno', 'Atlas'];
const ARTIST_LAST = ['Fields', 'Parade', 'Collective', 'Avenue', 'Motel', 'Theory', 'Club', 'Bloom'];

export const GENRES = [
  'Focus', 'Chill', 'Workout', 'Indie', 'Electronic', 'Jazz', 'Ambient', 'Road Trip',
  'Late Night', 'Morning', 'Synthwave', 'Acoustic',
];

const pick = (words: string[], n: number) => words[n % words.length];
const coverAt = (n: number) => `assets/covers/${n % COVER_COUNT}.png`;

function makeTrack(n: number): Track {
  const demo = n % DEMO_DURATIONS.length;
  // Coprime steps through the word lists keep the combinations from repeating early.
  const artist = `${pick(ARTIST_FIRST, n * 3)} ${pick(ARTIST_LAST, n * 5 + Math.floor(n / 8))}`;
  return {
    id: `t${n}`,
    title: `${pick(ADJECTIVES, n * 5)} ${pick(NOUNS, n * 7 + Math.floor(n / 12))}`,
    artist,
    album: `${pick(NOUNS, n)} of ${pick(ADJECTIVES, n * 11)}`,
    cover: coverAt(n),
    url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${demo + 1}.mp3`,
    duration: DEMO_DURATIONS[demo],
  };
}

export const TRACKS: Track[] = Array.from({ length: LARGE_LIBRARY_SIZE }, (_, n) => makeTrack(n));

const trackIndex = new Map(TRACKS.map((t) => [t.id, t]));
export const trackById = (id: string): Track | undefined => trackIndex.get(id);

const playlists: Collection[] = GENRES.map((genre, i) => ({
  id: `genre-${i}`,
  kind: 'playlist',
  title: `${genre} Mix`,
  subtitle: `${pick(ARTIST_FIRST, i)}, ${pick(ARTIST_LAST, i * 3)} and more`,
  cover: coverAt(i * 5),
  trackCount: TRACKS_PER_PLAYLIST,
}));

const albums: Collection[] = Array.from({ length: 12 }, (_, i) => ({
  id: `album-${i}`,
  kind: 'album',
  title: `${pick(ADJECTIVES, i * 7)} ${pick(NOUNS, i * 5)}`,
  subtitle: `${pick(ARTIST_FIRST, i * 3)} ${pick(ARTIST_LAST, i)}`,
  cover: coverAt(i * 7 + 3),
  trackCount: 10,
}));

const everything: Collection = {
  id: LARGE_LIBRARY_ID,
  kind: 'playlist',
  title: 'Everything',
  subtitle: `All ${LARGE_LIBRARY_SIZE.toLocaleString('en-US')} songs`,
  cover: coverAt(11),
  trackCount: LARGE_LIBRARY_SIZE,
};

export const COLLECTIONS: Collection[] = [everything, ...playlists, ...albums];

export function tracksOfCollection(id: string): Track[] {
  if (id === LARGE_LIBRARY_ID) return TRACKS;
  const [kind, raw] = id.split('-');
  const n = Number(raw);
  if (!Number.isInteger(n)) return [];
  // Each collection reads its own window of the catalog, always the same one.
  const size = kind === 'album' ? 10 : TRACKS_PER_PLAYLIST;
  const start = ((kind === 'album' ? 1000 : 0) + n * 37) % (TRACKS.length - size);
  return TRACKS.slice(start, start + size);
}

const SEARCH_LIMIT = 50;

export function searchTracks(query: string): Track[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  const found: Track[] = [];
  for (const t of TRACKS) {
    if (t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)) {
      found.push(t);
      if (found.length === SEARCH_LIMIT) break;
    }
  }
  return found;
}
