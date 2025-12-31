'use client';

interface ProductElement {
  title?: string;
  subtitle?: string;
  image_url?: string;
  buttons?: Array<{
    type: string;
    title: string;
    url: string;
  }>;
  default_action?: {
    url: string;
    type: string;
  };
}

interface ProductCarouselProps {
  elements: ProductElement[];
}

export default function ProductCarousel({ elements }: ProductCarouselProps) {
  if (!elements || elements.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="text-sm font-semibold text-gray-300 mb-3">Fresh Finds</div>
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-2" style={{ scrollbarWidth: 'thin' }}>
          {elements.map((element, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors flex-shrink-0 w-64"
            >
              {element.image_url && (
                <div className="relative w-full aspect-square bg-gray-700">
                  <img
                    src={element.image_url}
                    alt={element.title || 'Product'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23333"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
              )}
              <div className="p-3">
                {element.title && (
                  <h3 className="text-white font-semibold mb-1 line-clamp-2 text-sm">
                    {element.title}
                  </h3>
                )}
                {element.subtitle && (
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                    {element.subtitle}
                  </p>
                )}
                {element.buttons && element.buttons.length > 0 && (
                  <div className="flex gap-2">
                    {element.buttons.map((button, btnIndex) => (
                      <a
                        key={btnIndex}
                        href={button.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg text-center transition-colors"
                      >
                        {button.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

