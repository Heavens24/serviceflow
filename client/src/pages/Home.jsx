import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import SearchBar from "../components/home/SearchBar";
import Categories from "../components/home/Categories";
import FeaturedProviders from "../components/home/FeaturedProviders";
import HowItWorks from "../components/home/HowItWorks";
import BecomeProvider from "../components/home/BecomeProvider";
import Testimonials from "../components/home/Testimonials";
import Stats from "../components/home/Stats";
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
      <BecomeProvider />
      <Testimonials />
      <Stats />
      <Footer />
    </>
  );
}

export default Home;