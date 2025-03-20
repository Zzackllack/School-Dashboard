import React from 'react';

// Mock transportation data - would be replaced with real API data in production
const mockTransportation = [
  { type: 'Bus', line: '245', destination: 'Central Station', departureTime: '08:15', status: 'On time', platform: '3' },
  { type: 'Bus', line: '245', destination: 'Central Station', departureTime: '08:30', status: 'Delayed 5m', platform: '3' },
  { type: 'Bus', line: '122', destination: 'Shopping Mall', departureTime: '08:22', status: 'On time', platform: '1' },
  { type: 'Tram', line: '5', destination: 'University', departureTime: '08:18', status: 'On time', platform: '2' },
  { type: 'Tram', line: '5', destination: 'University', departureTime: '08:38', status: 'On time', platform: '2' },
];

const getStatusClass = (status: string) => {
  if (status.includes('Delayed')) return 'text-orange-500';
  if (status.includes('Cancelled')) return 'text-red-500';
  return 'text-green-500';
};

const Transportation = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
      <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">Public Transportation</h2>
      <div className="font-bold mb-2">
        Next departures from School Station:
      </div>
      <div className="flex-grow overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Line</th>
                <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Type</th>
                <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Destination</th>
                <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Time</th>
                <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Status</th>
                <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Platform</th>
              </tr>
            </thead>
            <tbody>
              {mockTransportation.map((transport, idx) => (
                <tr key={idx} className="even:bg-gray-100">
                  <td className="border border-gray-300 px-3 py-2 font-bold">{transport.line}</td>
                  <td className="border border-gray-300 px-3 py-2">{transport.type}</td>
                  <td className="border border-gray-300 px-3 py-2">{transport.destination}</td>
                  <td className="border border-gray-300 px-3 py-2">{transport.departureTime}</td>
                  <td className={`border border-gray-300 px-3 py-2 ${getStatusClass(transport.status)}`}>
                    {transport.status}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{transport.platform}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transportation;