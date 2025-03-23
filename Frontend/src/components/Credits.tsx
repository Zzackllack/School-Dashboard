const Credits = () => {
  // Use URLs instead of direct imports to avoid the JPEG parsing issue
  const classImageUrl = '/src/assets/Von/IMG_0380.JPEG';

  return (
    <div className="w-full py-6 px-4 bg-white border-t border-gray-200 mt-4">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-lg font-semibold text-[#8C7356] mb-3 text-center">Credits</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="text-center max-w-md">
            <p className="text-[#3E3128] mb-4 text-lg">
              Dieses Dashboard wurde mit Liebe von Cédric und mithilfe des Informatik Leistungskurses gemacht
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-64 text-center">
              <div className="h-40 overflow-hidden rounded-lg shadow-md">
                <img 
                  src={classImageUrl} 
                  alt="Informatik Leistungskurs" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Informatik+Leistungskurs';
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-[#5A4635]">Informatik Leistungskurs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
