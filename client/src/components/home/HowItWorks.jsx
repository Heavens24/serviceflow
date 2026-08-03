import {
  Search,
  CalendarDays,
  CircleCheckBig,
} from "lucide-react";

import howItWorks from "../../config/howItWorks";

function HowItWorks() {
  const icons = {
    search: (
      <Search
        size={52}
        className="text-blue-600"
        strokeWidth={2.2}
      />
    ),

    calendar: (
      <CalendarDays
        size={52}
        className="text-blue-600"
        strokeWidth={2.2}
      />
    ),

    check: (
      <CircleCheckBig
        size={52}
        className="text-green-600"
        strokeWidth={2.2}
      />
    ),
  };

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">
          <h2 className="text-4xl font-bold">
            How ServiceFlow Works
          </h2>

          <p className="mt-4 text-gray-600">
            Booking a trusted professional is simple.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 mt-16">

          {howItWorks.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-xl transition duration-300"
            >
              <div className="flex justify-center">
                {icons[item.icon]}
              </div>

              <div className="mt-6 text-blue-600 font-bold text-lg">
                {item.step}
              </div>

              <h3 className="text-2xl font-bold mt-3">
                {item.title}
              </h3>

              <p className="mt-4 text-gray-600">
                {item.description}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;