import testimonials from "../../config/testimonials";

function Testimonials() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">
          <h2 className="text-4xl font-bold">
            What People Are Saying
          </h2>

          <p className="mt-4 text-gray-600">
            Hear from customers and professionals using ServiceFlow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-14">

          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl shadow-md p-8"
            >
              <div className="text-yellow-500 text-xl">
                ⭐⭐⭐⭐⭐
              </div>

              <p className="mt-6 italic text-gray-700">
                "{testimonial.comment}"
              </p>

              <h3 className="mt-6 font-bold">
                {testimonial.name}
              </h3>

              <p className="text-gray-500">
                {testimonial.profession}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Testimonials;