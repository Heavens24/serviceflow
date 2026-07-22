import providers from "../../config/providers";

function FeaturedProviders() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">
          <h2 className="text-4xl font-bold text-slate-900">
            Featured Professionals
          </h2>

          <p className="text-gray-600 mt-4">
            Book trusted professionals recommended by ServiceFlow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">

          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden"
            >
              <div className="bg-blue-600 h-24 flex items-center justify-center text-5xl text-white">
                {provider.icon}
              </div>

              <div className="p-6">

                <h3 className="text-xl font-bold text-center">
                  {provider.name}
                </h3>

                <p className="text-center text-gray-500 mt-2">
                  {provider.profession}
                </p>

                <div className="flex justify-center mt-4">
                  <span className="text-yellow-500 font-semibold">
                    ⭐ {provider.rating}
                  </span>
                </div>

                <p className="text-center mt-3">
                  📍 {provider.location}
                </p>

                <p className="text-center text-blue-600 font-semibold mt-2">
                  {provider.price}
                </p>

                {provider.verified && (
                  <div className="text-center mt-3">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      ✓ Verified
                    </span>
                  </div>
                )}

                <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition">
                  Book Now
                </button>

              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default FeaturedProviders;