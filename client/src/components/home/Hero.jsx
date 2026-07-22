function Hero() {
  return (
    <section className="bg-slate-100 py-24">
      <div className="max-w-7xl mx-auto px-6 text-center">

        <h1 className="text-5xl font-bold text-slate-900">
          Find Trusted Professionals Near You
        </h1>

        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Book electricians, mechanics, plumbers,
          doctors, tutors, beauty professionals and
          many more—all in one place.
        </p>

        <div className="mt-10 flex justify-center gap-4">

          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
            Book a Service
          </button>

          <button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition">
            Become a Provider
          </button>

        </div>

      </div>
    </section>
  );
}

export default Hero;