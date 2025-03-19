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
  if (status.includes('Delayed')) return 'status-delayed';
  if (status.includes('Cancelled')) return 'status-cancelled';
  return 'status-on-time';
};

const Transportation = () => {
  return (
    <div className="dashboard-panel transportation-panel">
      <h2>Public Transportation</h2>
      <div className="transportation-time">
        Next departures from School Station:
      </div>
      <div className="transportation-list">
        <table className="transportation-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Type</th>
              <th>Destination</th>
              <th>Time</th>
              <th>Status</th>
              <th>Platform</th>
            </tr>
          </thead>
          <tbody>
            {mockTransportation.map((transport, idx) => (
              <tr key={idx}>
                <td><strong>{transport.line}</strong></td>
                <td>{transport.type}</td>
                <td>{transport.destination}</td>
                <td>{transport.departureTime}</td>
                <td className={getStatusClass(transport.status)}>
                  {transport.status}
                </td>
                <td>{transport.platform}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transportation;