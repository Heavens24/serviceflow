import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import SearchBar from "../components/home/SearchBar";
import Categories from "../components/home/Categories";
import FeaturedProviders from "../components/home/FeaturedProviders";
import HowItWorks from "../components/home/HowItWorks";
import Footer from "../components/layout/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <SearchBar />
      <Categories />
      <FeaturedProviders />
      <HowItWorks />
      <Footer />
    </>
  );
}

export default Home;