function Card({ children }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition duration-300">
      {children}
    </div>
  );
}

export default Card;