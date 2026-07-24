function SectionTitle({
  title,
  subtitle,
}) {
  return (
    <div className="text-center mb-16">

      <h2 className="text-4xl font-bold">
        {title}
      </h2>

      <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
        {subtitle}
      </p>

    </div>
  );
}

export default SectionTitle;