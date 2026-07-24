function Input({
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
    />
  );
}

export default Input;