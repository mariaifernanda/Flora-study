export interface WikiImage {
  title: string;
  url: string;
  descriptionUrl: string;
  width: number;
  height: number;
}

export async function searchWikimediaImages(query: string, limit = 6): Promise<WikiImage[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|dimensions',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
  });

  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    return Object.values(pages)
      .map((page: unknown) => {
        const p = page as {
          title: string;
          imageinfo?: Array<{ thumburl?: string; url: string; descriptionurl: string; width: number; height: number }>;
        };
        const info = p.imageinfo?.[0];
        if (!info) return null;
        return {
          title: p.title.replace(/^File:/, ''),
          url: info.thumburl || info.url,
          descriptionUrl: info.descriptionurl,
          width: info.width,
          height: info.height,
        };
      })
      .filter((img): img is WikiImage => img !== null && img.url.match(/\.(jpg|jpeg|png|gif|svg|webp)/i) !== null);
  } catch {
    return [];
  }
}
