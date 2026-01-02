
export interface Show {
  id: string;
  title: string;
  year: string;
  genre: string;
  description: string;
  posterUrl: string;
  thumbUrl: string;
  backdropUrl?: string;
  rating?: string | null;
  imdbVotes?: number;
  director?: string;
  cast?: string[];
  originalLanguage?: string;
}

export type Genre = 'All' | 'Action' | 'Animation' | 'Comedy' | 'Crime' | 'Drama' | 'Documentary' | 'Kids' | 'Sci-Fi & Fantasy' | 'Soap';

export const GENRE_MAP: Partial<Record<Genre, number>> = {
  'Action': 10759,
  'Animation': 16,
  'Comedy': 35,
  'Crime': 80,
  'Drama': 18,
  'Documentary': 99,
  'Kids': 10762,
  'Sci-Fi & Fantasy': 10765,
  'Soap': 10766
};

export const GENRES: Genre[] = [
  'All', 
  'Action', 
  'Animation', 
  'Comedy', 
  'Crime', 
  'Drama', 
  'Documentary', 
  'Kids', 
  'Sci-Fi & Fantasy', 
  'Soap'
];

export type Region = 'All' | 'USA' | 'UK';

export const REGION_MAP: Record<Exclude<Region, 'All'>, string> = {
  'USA': 'US',
  'UK': 'GB'
};

export const REGIONS: Region[] = ['All', 'USA', 'UK'];

export const DECADES: string[] = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s', '1960s', '1950s'];
