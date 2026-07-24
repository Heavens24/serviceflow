function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
}) {
  const styles = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white",

    secondary:
      "bg-white border border-blue-600 text-blue-600 hover:bg-blue-50",

    success:
      "bg-green-600 hover:bg-green-700 text-white",

    danger:
      "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold transition duration-300 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export default Button;