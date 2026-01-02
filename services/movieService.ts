import { Show, Genre, GENRE_MAP, Region, REGION_MAP } from "../types";

const TMDB_API_KEY = "b14f24c2e189996413174a9e9d3fa115"; 
const OMDB_API_KEY = "42ebe43b";
const BASE_URL = "https://api.themoviedb.org/3";
const OMDB_URL = "https://www.omdbapi.com/";
const IMAGE_BASE = "https://image.tmdb.org/t/p/original"; 
const THUMB_BASE = "https://image.tmdb.org/t/p/w500";

export interface ShowResponse {
  shows: Show[];
  totalPages: number;
}

export class TVService {
  /**
   * Fetches TV series using TMDB's discover API, then enriches them with OMDb/IMDb data.
   */
  static async getTVSeries(selectedRegion: Region, selectedGenre: Genre, decade: string, page: number = 1): Promise<ShowResponse> {
    try {
      const startYear = parseInt(decade.replace('s', ''));
      const endYear = startYear + 9;
      const startDate = `${startYear}-01-01`;
      const endDate = `${endYear}-12-31`;
      
      const params: Record<string, string> = {
        api_key: TMDB_API_KEY,
        'first_air_date.gte': startDate,
        'first_air_date.lte': endDate,
        include_adult: 'false',
        language: 'en-US',
        page: page.toString(),
        sort_by: 'popularity.desc',
      };

      // Apply Region Filter
      if (selectedRegion !== 'All') {
        params.with_origin_country = REGION_MAP[selectedRegion];
      }

      // Apply Genre Filter
      if (selectedGenre !== 'All') {
        const genreId = GENRE_MAP[selectedGenre];
        if (genreId) {
          params.with_genres = genreId.toString();
        }
      }

      const queryParams = new URLSearchParams(params);
      const url = `${BASE_URL}/discover/tv?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`TMDB Error: ${response.status}`);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return { shows: [], totalPages: 0 };
      }

      // 1. Initial filter for specific language requirements - Exclude Japanese ('ja')
      const filteredResults = data.results.filter((item: any) => {
        if (!item.poster_path || item.adult) return false;
        const lang = item.original_language;
        return ['en', 'it', 'fr', 'es', 'ko'].includes(lang);
      });

      // 2. Enrich with OMDb data
      const enrichedShows = await Promise.all(
        filteredResults.map(async (tmdbShow: any) => {
          try {
            const extUrl = `${BASE_URL}/tv/${tmdbShow.id}/external_ids?api_key=${TMDB_API_KEY}`;
            const extRes = await fetch(extUrl);
            const extData = await extRes.json();
            const imdbId = extData.imdb_id;

            if (!imdbId) return this.transformTmdbOnly(tmdbShow, selectedGenre);

            const omdbRes = await fetch(`${OMDB_URL}?i=${imdbId}&apikey=${OMDB_API_KEY}`);
            const omdbData = await omdbRes.json();

            if (omdbData.Response === "False") return this.transformTmdbOnly(tmdbShow, selectedGenre);

            return {
              id: tmdbShow.id.toString(),
              title: tmdbShow.name,
              year: tmdbShow.first_air_date ? tmdbShow.first_air_date.split('-')[0] : 'N/A',
              genre: selectedGenre,
              description: tmdbShow.overview || "No description provided.",
              posterUrl: `${IMAGE_BASE}${tmdbShow.poster_path}`,
              thumbUrl: `${THUMB_BASE}${tmdbShow.poster_path}`,
              backdropUrl: tmdbShow.backdrop_path ? `${IMAGE_BASE}${tmdbShow.backdrop_path}` : undefined,
              rating: omdbData.imdbRating && omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : (tmdbShow.vote_average?.toFixed(1) || null),
              imdbVotes: omdbData.imdbVotes ? parseInt(omdbData.imdbVotes.replace(/,/g, '')) : 0,
              originalLanguage: tmdbShow.original_language
            };
          } catch (e) {
            return this.transformTmdbOnly(tmdbShow, selectedGenre);
          }
        })
      );

      // 3. Rank by IMDb Rating Descending
      const rankedShows = enrichedShows.sort((a, b) => {
        const ratingA = parseFloat(a.rating || '0');
        const ratingB = parseFloat(b.rating || '0');
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.imdbVotes || 0) - (a.imdbVotes || 0);
      });

      return { 
        shows: rankedShows,
        totalPages: data.total_pages
      };
    } catch (error) {
      console.error("Discovery Error:", error);
      throw error;
    }
  }

  private static transformTmdbOnly(item: any, selectedGenre: string): Show {
    return {
      id: item.id.toString(),
      title: item.name,
      year: item.first_air_date ? item.first_air_date.split('-')[0] : 'N/A',
      genre: selectedGenre,
      description: item.overview || "No description provided.",
      posterUrl: `${IMAGE_BASE}${item.poster_path}`,
      thumbUrl: `${THUMB_BASE}${item.poster_path}`,
      backdropUrl: item.backdrop_path ? `${IMAGE_BASE}${item.backdrop_path}` : undefined,
      rating: item.vote_average ? item.vote_average.toFixed(1) : null,
      imdbVotes: item.vote_count || 0,
      originalLanguage: item.original_language
    };
  }

  static async getShowDetails(showId: string): Promise<{ director: string, cast: string[] }> {
    try {
      const url = `${BASE_URL}/tv/${showId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
      const response = await fetch(url);
      if (!response.ok) return { director: 'N/A', cast: [] };
      const data = await response.json();
      const creator = data.created_by?.[0]?.name || 'N/A';
      const cast = data.credits?.cast?.slice(0, 15).map((person: any) => person.name) || [];
      return { director: creator, cast };
    } catch (error) {
      return { director: 'N/A', cast: [] };
    }
  }
}