import React from 'react'
import Banner from './Banner'
import FeaturedBooks from './FeaturedBooks'
import BestSellers from './BestSellers'
import DealsSection from './DealsSection'
import RecentlyViewed from './RecentlyViewed'
import NewReleases from './NewReleases'
import Recommendation from './Recommendation'

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
        {/* Banner */}
        <Banner/>
        
        {/* Recently Viewed Books */}
        <RecentlyViewed/>
        
        {/* Featured Books Section */}
        <FeaturedBooks/>
        
        {/* Recommendations */}
        <Recommendation />
        
        {/* Best Sellers */}
        <BestSellers/>
        
        {/* New Releases */}
        <NewReleases/>
        
        {/* Deals Section */}
        <DealsSection/>
    </div>
  )
}

export default Home