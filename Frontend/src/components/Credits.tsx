const Credits = () => {
  // Use URLs instead of direct imports to avoid the JPEG parsing issue
  const classImageUrl = '/src/assets/Von/IMG_0380.JPEG';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 w-full">
      <h2 className="text-xl font-bold text-[#8C7356] border-b border-gray-200 pb-2 mb-4">Credits</h2>
      
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-[#3E3128] mb-2">
            Dieses Dashboard wurde mit Liebe von <strong>Cédric</strong> und mithilfe des Informatik Leistungskurses gemacht
          </p>
        </div>
        
        <div className="w-full">
          <div className="h-40 overflow-hidden rounded-lg shadow-md max-w-xs mx-auto">
            <img 
              src={classImageUrl} 
              alt="Informatik Leistungskurs" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://kappa.lol/4eRovO';
              }}
            />
          </div>
          <p className="mt-2 text-sm text-[#5A4635] text-center">Informatik Leistungskurs</p>
        </div>
      </div>
    </div>
  );
};

export default Credits;
