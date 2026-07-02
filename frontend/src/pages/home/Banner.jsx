import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useFetchAllBannersQuery } from '../../redux/features/banners/bannersApi'
import { getBannerUrl } from '../../utils/getBannerUrl'

const Banner = () => {
    const { data: banners, isLoading, error } = useFetchAllBannersQuery();

    const slides = useMemo(() => {
        if (banners) {
            return banners
                .filter(banner => banner.isActive)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .slice(0, 5) // Limit to 5 banners
                .map(banner => ({
                    id: banner._id,
                    src: getBannerUrl(banner.imageUrl),
                    alt: banner.title
                }));
        }
        return [];
    }, [banners]);

    const [index, setIndex] = useState(0)
  const intervalRef = useRef(null)

  const goTo = (i) => setIndex((i + slides.length) % slides.length)
  const next = () => goTo(index + 1)
  const prev = () => goTo(index - 1)

  useEffect(() => {
    intervalRef.current && clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % slides.length)
    }, 4000)
    return () => clearInterval(intervalRef.current)
  }, [slides.length])

  if (isLoading) {
    return (
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="h-[260px] sm:h-[340px] lg:h-[420px] bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !slides || slides.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Carousel */}
        <div
          className="relative overflow-hidden rounded-2xl shadow-xl mt-6"
          onMouseEnter={() => intervalRef.current && clearInterval(intervalRef.current)}
          onMouseLeave={() => {
            intervalRef.current = setInterval(() => {
              setIndex((prevIndex) => (prevIndex + 1) % slides.length)
            }, 4000)
          }}
        >
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((s) => (
              <div key={s.id} className="min-w-full h-[260px] sm:h-[340px] lg:h-[420px] relative bg-black">
                <img
                  src={s.src}
                  alt={s.alt}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>

          {/* Arrows */}
          <button
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow"
            onClick={prev}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow"
            onClick={next}
          >
            <FiChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2.5 rounded-full transition-all ${index === i ? 'w-6 bg-white' : 'w-2.5 bg-white/60'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Banner