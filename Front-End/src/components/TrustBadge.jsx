const TrustBadge = () => {
  return (
    <section className="flex flex-row items-center  gap-4 sm:gap-24 px-4 sm:px-16 pb-16 -mt-8">
      <div className="text-center sm:text-left">
        <h2 className="text-3xl font-bold text-blue-600">500+</h2>
        <p className="text-gray-600">Happy Clients</p>
      </div>

      <div className="text-center sm:text-left">
        <h2 className="text-3xl font-bold text-blue-600">100%</h2>
        <p className="text-gray-600">Licensed Water</p>
      </div>

      <div className="text-center sm:text-left">
        <h2 className="text-3xl font-bold text-blue-600">24h</h2>
        <p className="text-gray-600">Fast Delivery</p>
      </div>
    </section>
  );
};

export default TrustBadge;
