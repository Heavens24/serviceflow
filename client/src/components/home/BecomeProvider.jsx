function BecomeProvider() {
  return (
    <section className="bg-blue-600 text-white py-24">
      <div className="max-w-6xl mx-auto px-6 text-center">

        <h2 className="text-4xl font-bold">
          Grow Your Business with ServiceFlow
        </h2>

        <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
          Join electricians, mechanics, plumbers, doctors, salons,
          tutors, cleaners, and hundreds of other professionals who are
          growing their businesses through ServiceFlow.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-16">

          <div className="bg-white text-slate-900 rounded-xl p-8 shadow-lg">
            <div className="text-5xl">📈</div>

            <h3 className="text-2xl font-bold mt-5">
              More Customers
            </h3>

            <p className="mt-4 text-gray-600">
              Reach people actively searching for your services.
            </p>
          </div>

          <div className="bg-white text-slate-900 rounded-xl p-8 shadow-lg">
            <div className="text-5xl">📅</div>

            <h3 className="text-2xl font-bold mt-5">
              Manage Bookings
            </h3>

            <p className="mt-4 text-gray-600">
              Accept appointments without endless WhatsApp messages.
            </p>
          </div>

          <div className="bg-white text-slate-900 rounded-xl p-8 shadow-lg">
            <div className="text-5xl">💰</div>

            <h3 className="text-2xl font-bold mt-5">
              Increase Income
            </h3>

            <p className="mt-4 text-gray-600">
              Turn more enquiries into paying customers.
            </p>
          </div>

        </div>

        <button className="mt-14 bg-white text-blue-600 font-bold px-10 py-4 rounded-xl hover:bg-gray-100 transition">
          Become a Provider
        </button>

      </div>
    </section>
  );
}

export default BecomeProvider;