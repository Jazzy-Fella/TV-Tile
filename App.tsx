import { useState, useEffect, useCallback, useRef } from 'react';
import { Film, ChevronDown, Loader2, Search, AlertCircle, ExternalLink, X, Star, Info, Play, Award, Users, Clapperboard, Globe } from 'lucide-react';
import { Show, Genre, GENRES, DECADES, Region, REGIONS } from './types';
import { TVService } from './services/movieService';
import MovieCard from './components/MovieCard';
import LoadingSkeleton from './components/LoadingSkeleton';

const getRandomDecade = (): string => {
  const options = ['2010s', '2000s', '1990s', '1980s'];
  return options[Math.floor(Math.random() * options.length)];
};

const getRandomGenre = (): Genre => {
  const availableGenres = GENRES.filter(g => g !== 'All');
  return availableGenres[Math.floor(Math.random() * availableGenres.length)];
};

const App = () => {
  const [selectedRegion, setSelectedRegion] = useState<Region>('All');
  const [selectedGenre, setSelectedGenre] = useState<Genre>(getRandomGenre);
  const [selectedDecade, setSelectedDecade] = useState<string>(getRandomDecade);
  
  const [shows, setShows] = useState<Show[]>([]);
  const [featuredShow, setFeaturedShow] = useState<Show | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [activeShow, setActiveShow] = useState<Show | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isCastExpanded, setIsCastExpanded] = useState(false);

  const initialMount = useRef(true);

  const fetchShows = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    try {
      const targetPage = isLoadMore ? page + 1 : 1;
      const response = await TVService.getTVSeries(selectedRegion, selectedGenre, selectedDecade, targetPage);
      
      if (isLoadMore) {
        setShows(prev => [...prev, ...response.shows]);
        setPage(targetPage);
      } else {
        if (response.shows.length > 0) {
          const best = response.shows[0];
          setFeaturedShow(best);
          setShows(response.shows.filter(m => m.id !== best.id));
        } else {
          setFeaturedShow(null);
          setShows([]);
        }
        setPage(1);
        if (response.shows.length === 0) {
          const regionText = selectedRegion === 'All' ? '' : ` in ${selectedRegion}`;
          setError(`No series found for ${selectedGenre}${regionText} in the ${selectedDecade}.`);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Database connection error. Try another selection.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedRegion, selectedGenre, selectedDecade, page]);

  useEffect(() => {
    if (initialMount.current) {
      fetchShows();
      initialMount.current = false;
    }
  }, []);

  const handleSearch = () => fetchShows(false);
  
  const closeModal = () => {
    setActiveShow(null);
    setShowInfo(false);
    setIsCastExpanded(false);
  };

  const openModal = async (show: Show) => {
    setActiveShow(show);
    setShowInfo(false);
    setIsCastExpanded(false);
    setDetailsLoading(true);
    
    try {
      const details = await TVService.getShowDetails(show.id);
      setActiveShow(prev => prev && prev.id === show.id ? { ...prev, ...details } : prev);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/10 flex flex-col font-sans">
      {/* Header */}
      <header className="relative bg-[#050505] border-b border-white/5 px-4 md:px-10 py-3 z-[60]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white text-black rounded flex items-center justify-center shadow-lg">
              <Film className="w-4 h-4" />
            </div>
            <h1 className="text-sm font-black tracking-tighter italic uppercase">TVTILE</h1>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 w-full lg:w-auto">
            <div className="flex flex-1 items-center min-w-0">
              {/* Region Filter */}
              <div className="relative flex-1 min-w-[80px]">
                <select 
                  value={selectedRegion} 
                  onChange={(e) => setSelectedRegion(e.target.value as Region)} 
                  className="w-full appearance-none bg-transparent text-[10px] font-bold uppercase tracking-widest rounded-lg pl-3 pr-8 py-2 focus:outline-none cursor-pointer truncate"
                >
                  {REGIONS.map(r => <option key={r} value={r} className="bg-[#0a0a0a] text-white">{r}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
              </div>
              <div className="w-[1px] h-3 bg-white/10" />
              
              {/* Genre Filter */}
              <div className="relative flex-1 min-w-[120px]">
                <select 
                  value={selectedGenre} 
                  onChange={(e) => setSelectedGenre(e.target.value as Genre)} 
                  className="w-full appearance-none bg-transparent text-[10px] font-bold uppercase tracking-widest rounded-lg pl-3 pr-8 py-2 focus:outline-none cursor-pointer truncate"
                >
                  {GENRES.map(g => <option key={g} value={g} className="bg-[#0a0a0a] text-white">{g}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
              </div>
              <div className="w-[1px] h-3 bg-white/10" />
              
              {/* Decade Filter */}
              <div className="relative flex-1 min-w-[85px]">
                <select 
                  value={selectedDecade} 
                  onChange={(e) => setSelectedDecade(e.target.value)} 
                  className="w-full appearance-none bg-transparent text-[10px] font-bold uppercase tracking-widest rounded-lg pl-3 pr-8 py-2 focus:outline-none cursor-pointer"
                >
                  {DECADES.map(d => <option key={d} value={d} className="bg-[#0a0a0a] text-white">{d}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
              </div>
            </div>
            <button 
              onClick={handleSearch} 
              disabled={loading} 
              className="px-5 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-grow w-full">
        {error ? (
          <div className="py-24 max-w-7xl mx-auto px-6 flex flex-col items-center text-center gap-6">
            <AlertCircle className="w-12 h-12 text-neutral-800" />
            <h3 className="text-xl font-black uppercase italic tracking-tight">{error}</h3>
            <button onClick={handleSearch} className="px-10 py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all">
              Try Again
            </button>
          </div>
        ) : loading && page === 1 ? (
          <div className="max-w-7xl mx-auto px-4 md:px-10 mt-8">
            <LoadingSkeleton />
          </div>
        ) : (
          <div className="w-full">
            {/* Featured Section */}
            {featuredShow && (
              <section 
                onClick={() => openModal(featuredShow)}
                className="group relative w-full h-[60vh] md:h-[75vh] cursor-pointer overflow-hidden mb-12"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent z-10" />
                
                <img 
                  src={featuredShow.backdropUrl || featuredShow.posterUrl} 
                  alt={featuredShow.title}
                  className="w-full h-full object-cover transform transition-transform duration-[3s] group-hover:scale-105"
                />

                <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-16 max-w-7xl mx-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                      <Award className="w-3 h-3 text-yellow-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Top Rated</span>
                    </div>
                    <div className="bg-yellow-500 text-black px-4 py-1.5 rounded-full flex items-center gap-2">
                      <Star className="w-3 h-3 fill-black" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{featuredShow.rating} IMDb</span>
                    </div>
                  </div>
                  
                  <h2 className="text-4xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter mb-6 uppercase italic">
                    {featuredShow.title}
                  </h2>
                  
                  <p className="max-w-2xl text-neutral-300 text-sm md:text-lg font-light leading-relaxed mb-8 italic line-clamp-3 md:line-clamp-none">
                    {featuredShow.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 relative z-30">
                    <a 
                      href={`https://web.stremio.com/#/search?search=${encodeURIComponent(featuredShow.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-8 py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center gap-3 shadow-2xl transition-transform active:scale-95 hover:bg-neutral-200"
                    >
                      <Play className="w-4 h-4 fill-black" /> Stream
                    </a>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openModal(featuredShow); }}
                      className="px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-white hover:text-black transition-all flex items-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Info</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-10 pb-8 w-full">
              <div className="flex items-center justify-between mb-8 opacity-50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">
                  {selectedRegion !== 'All' ? `${selectedRegion} ` : ''}IMDb Ranked {selectedGenre} Series • {selectedDecade}
                </h3>
                <div className="h-[1px] flex-grow mx-8 bg-white/10" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                {shows.map((show, idx) => (
                  <MovieCard key={`${show.id}-${idx}`} movie={show as any} onClick={openModal as any} />
                ))}
              </div>

              {!loading && shows.length > 0 && (
                <div className="mt-20 pb-20 flex justify-center">
                  <button 
                    onClick={() => fetchShows(true)}
                    disabled={loadingMore}
                    className="px-12 py-4 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all"
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load More Series'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Show Details Modal */}
      {activeShow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 md:p-12 lg:p-20">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={closeModal} />
          
          <div className="relative w-full h-full max-w-6xl max-h-[95vh] overflow-hidden rounded-none sm:rounded-[32px] shadow-2xl flex flex-col bg-[#050505] animate-in zoom-in-95 duration-300 border border-white/5">
            {/* Header Controls */}
            <div className="w-full flex items-center justify-end gap-2 p-4 md:p-6 z-[70] bg-[#050505]">
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`px-4 py-2.5 rounded-xl border backdrop-blur-xl transition-all flex items-center gap-2 ${showInfo ? 'bg-white text-black border-white' : 'bg-black/50 text-white border-white/10'}`}
              >
                <Info className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Info</span>
              </button>
              <button onClick={closeModal} className="p-2.5 bg-black/50 text-white rounded-xl border border-white/10 hover:bg-white hover:text-black transition-all backdrop-blur-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewport */}
            <div className="flex-1 relative w-full overflow-hidden flex items-center justify-center p-4">
              <img 
                src={activeShow.posterUrl} 
                alt={activeShow.title} 
                className={`max-h-full max-w-full object-contain z-10 transition-transform duration-700 -translate-y-6 scale-[1.08] ${showInfo ? 'scale-90 opacity-40 blur-sm' : 'opacity-100'}`} 
              />

              {/* Info Layer */}
              <div className={`absolute inset-0 z-30 overflow-hidden flex items-center justify-center transition-all duration-500 ease-in-out ${showInfo ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
                 <div className="absolute inset-0 z-0 pointer-events-none">
                    <img 
                      src={activeShow.backdropUrl || activeShow.posterUrl} 
                      alt="" 
                      className="w-full h-full object-cover opacity-40 blur-[100px] scale-125"
                    />
                    <div className="absolute inset-0 bg-[#050505]/60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80" />
                 </div>
                 
                 <div className="max-w-2xl w-full relative z-10 p-8 md:p-16">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="bg-yellow-500 text-black px-3 py-1 rounded-lg flex items-center gap-2">
                        <Star className="w-3 h-3 fill-black" />
                        <span className="text-[10px] font-black">{activeShow.rating || 'N/A'} IMDb</span>
                      </div>
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.4em]">{activeShow.year}</span>
                      {activeShow.originalLanguage && (
                        <div className="flex items-center gap-1.5 text-neutral-500 ml-auto">
                          <Globe className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{activeShow.originalLanguage}</span>
                        </div>
                      )}
                   </div>
                   
                   <h2 className="text-3xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-4 italic uppercase">{activeShow.title}</h2>
                   
                   <div className="flex flex-col gap-4 mb-8">
                      {detailsLoading ? (
                        <div className="flex items-center gap-2 opacity-20">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Loading Credits...</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-4">
                            <Clapperboard className="w-4 h-4 text-neutral-500 mt-1" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Creator</span>
                              <span className="text-sm font-bold text-white/90">{activeShow.director || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <Users className="w-4 h-4 text-neutral-500 mt-1" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Starring</span>
                              <div className="flex flex-wrap items-center gap-x-2">
                                <span className={`text-sm font-bold text-white/90 ${!isCastExpanded ? 'line-clamp-1' : ''}`}>
                                  {activeShow.cast?.join(', ') || 'N/A'}
                                </span>
                                {activeShow.cast && activeShow.cast.length > 3 && (
                                  <button onClick={() => setIsCastExpanded(!isCastExpanded)} className="text-[9px] font-black uppercase text-neutral-500 hover:text-white underline underline-offset-4">
                                    {isCastExpanded ? 'Less' : 'More'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                   </div>

                   <p className="text-neutral-300 text-sm md:text-lg leading-relaxed mb-10 font-medium italic max-h-40 overflow-y-auto pr-4 custom-scrollbar">
                      {activeShow.description}
                   </p>

                   <div className="flex flex-col sm:flex-row gap-3">
                      <a 
                        href={`https://web.stremio.com/#/search?search=${encodeURIComponent(activeShow.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-3 p-4 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl active:scale-95"
                      >
                         Stream Series
                      </a>
                      <a 
                        href={`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(activeShow.title)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1 flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                      >
                        <ExternalLink className="w-4 h-4" /> Wikipedia
                      </a>
                   </div>
                 </div>
              </div>
            </div>

            {/* Stream Footer */}
            <div className="w-full bg-[#0a0a0a] border-t border-white/5 pt-3 pb-7 px-5 z-[50] flex justify-center items-center">
              <a 
                href={`https://web.stremio.com/#/search?search=${encodeURIComponent(activeShow.title)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full max-w-sm flex items-center justify-center gap-4 px-10 py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-neutral-200 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" /> Stream Now
              </a>
            </div>
          </div>
        </div>
      )}

      <footer className="py-12 text-center border-t border-white/5 bg-[#050505] z-10">
        <p className="text-[8px] font-black uppercase tracking-[1.2em] opacity-30">TVTILE Cinematic • Powered by TMDB & OMDb</p>
      </footer>
    </div>
  );
};

export default App;