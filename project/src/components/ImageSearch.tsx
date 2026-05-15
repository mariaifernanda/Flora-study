import { useState } from 'react';
import { Search, Image, ExternalLink, Loader2, X } from 'lucide-react';
import { searchWikimediaImages, type WikiImage } from '../lib/wikimedia';

interface ImageSearchProps {
  defaultQuery?: string;
}

export default function ImageSearch({ defaultQuery = '' }: ImageSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [images, setImages] = useState<WikiImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<WikiImage | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const results = await searchWikimediaImages(query, 9);
    setImages(results);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-forest-900 border border-forest-700 rounded-xl px-3 py-2 focus-within:border-mint-600 transition-colors">
          <Search className="w-3.5 h-3.5 text-forest-500 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar imagens no Wikimedia..."
            className="flex-1 bg-transparent font-mono text-white text-xs placeholder-forest-600 outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-3 py-2 bg-forest-700 hover:bg-forest-600 disabled:opacity-40 text-white rounded-xl font-mono text-xs transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-mint-400 animate-spin" />
        </div>
      )}

      {!loading && searched && images.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6">
          <Image className="w-8 h-8 text-forest-700" strokeWidth={1} />
          <p className="font-mono text-forest-600 text-xs">Nenhuma imagem encontrada</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(img)}
              className="relative aspect-square rounded-lg overflow-hidden bg-forest-800 border border-forest-700 hover:border-mint-600 transition-all group"
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-forest-900 border border-forest-700 rounded-2xl overflow-hidden max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-forest-800 rounded-lg text-forest-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selected.url}
              alt={selected.title}
              className="w-full max-h-96 object-contain bg-forest-950"
            />
            <div className="px-4 py-3 flex items-start justify-between gap-3">
              <p className="font-mono text-forest-300 text-xs leading-relaxed">{selected.title}</p>
              <a
                href={selected.descriptionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-mint-400 hover:text-mint-300 font-mono text-xs flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
                Wikimedia
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
