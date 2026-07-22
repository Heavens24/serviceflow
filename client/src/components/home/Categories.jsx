import categories from "../../config/categories";

function Categories() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-center text-slate-900">
          Popular Categories
        </h2>

        <p className="text-center text-gray-600 mt-4">
          Find trusted professionals across a wide range of services.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">

          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 p-8 text-center cursor-pointer"
            >
              <div className="text-5xl">
                {category.icon}
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                {category.name}
              </h3>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Categories;