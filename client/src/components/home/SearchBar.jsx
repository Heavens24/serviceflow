import services from "../../config/services";

function SearchBar() {
  return (
    <section className="bg-white py-10 shadow-md">
      <div className="max-w-6xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Service */}

          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Service
            </label>

            <select className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500">

              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}

            </select>

          </div>

          {/* Location */}

          <div>

            <label className="block mb-2 font-semibold text-gray-700">
              Location
            </label>

            <input
              type="text"
              placeholder="Enter your city..."
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* Search Button */}

          <div className="flex items-end">

            <button
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Search Providers
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}

export default SearchBar;