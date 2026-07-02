import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import BookCard from '../books/BookCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useFetchAllBooksQuery } from '../../redux/features/books/booksApi';

const genres = ["Choose a genre", "Business", "Fiction", "Horror", "Adventure"]

const TopSellers = () => {
    
    const [selectedGenre, setSelectedGenre] = useState("Choose a genre");
    const location = useLocation();

   const {data: books = []} = useFetchAllBooksQuery();

    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const q = searchParams.get('q')?.toLowerCase() || '';

    const filteredBooks = (selectedGenre === "Choose a genre" ? books : books.filter(book => book.genres === selectedGenre.toLowerCase()))
      .filter(b => q ? (b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)) : true)

    return (
        <div className='py-10'>
            <h2 className='text-3xl font-semibold mb-6'>Top Sellers</h2>
            {/* genre filtering */}
            <div className='mb-8 flex items-center'>
                <select
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    name="genre" id="genre" className='border bg-[#EAEAEA] border-gray-300 rounded-md px-4 py-2 focus:outline-none'>
                    {
                        genres.map((genre, index) => (
                            <option key={index} value={genre}>{genre}</option>
                        ))
                    }
                </select>
            </div>

            <Swiper
                slidesPerView={1}
                spaceBetween={30}
                navigation={true}
                breakpoints={{
                    640: {
                        slidesPerView: 1,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 40,
                    },
                    1024: {
                        slidesPerView: 2,
                        spaceBetween: 50,
                    },
                    1180: {
                        slidesPerView: 3,
                        spaceBetween: 50,
                    }
                }}
                modules={[Pagination, Navigation]}
                className="mySwiper"
            >
                {
                   filteredBooks.length > 0 && filteredBooks.map((book, index) => (
                        <SwiperSlide key={index}>
                            <BookCard  book={book} />
                        </SwiperSlide>
                    ))
                }
            </Swiper>


        </div>
    )
}

export default TopSellers