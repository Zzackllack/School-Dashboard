const Credits = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 w-full">
      <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
        Credits
      </h2>

      <div className="flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-[#3E3128] mb-2">
            Dieses Dashboard wurde mit ♥️ von <strong>Cédric</strong> und
            mithilfe des Informatik Leistungskurses gemacht
          </p>
        </div>

        <div className="w-full">
          <div className="mx-auto max-w-[18rem]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 shadow-md">
              <img
                src="/images/LK.JPEG"
                alt="Informatik Leistungskurs"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
          <p className="mt-2 text-center text-sm text-[#5A4635]">
            Informatik Leistungskurs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Credits;
