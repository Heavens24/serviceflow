import stats from "../../config/stats";

function Stats() {
  return (
    <section className="bg-slate-900 text-white py-20">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">
          <h2 className="text-4xl font-bold">
            Trusted Across South Africa
          </h2>

          <p className="mt-4 text-slate-300">
            Connecting customers with trusted professionals every day.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mt-14">

          {stats.map((stat) => (
            <div key={stat.id} className="text-center">
              <h3 className="text-5xl font-bold text-blue-400">
                {stat.number}
              </h3>

              <p className="mt-3 text-slate-300">
                {stat.label}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Stats;