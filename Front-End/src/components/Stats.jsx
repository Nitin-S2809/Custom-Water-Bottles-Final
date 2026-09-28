const Stats = () => {
  return (
    <div className="hidden lg:flex absolute left-6 bg-white shadow-xl rounded-2xl ml-165 -mt-20 px-5 py-4 flex items-center gap-4">
      <div className="bg-sky-500 text-white p-3 rounded-xl">
        ✓
      </div>
      <div>
        <p className="font-semibold">Certified & Safe</p>
        <p className="text-sm text-gray-500">FDA Approved Water</p>
      </div>
    </div>
  );
};

export default Stats;
