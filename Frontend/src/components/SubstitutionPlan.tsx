import { useState, useEffect } from 'react';

// Mock data - would be replaced with real data in a production environment
const mockSubstitutions = [
    { id: 1, date: '2023-10-30', className: '10A', period: 1, subject: 'Math', teacher: 'Mrs. Smith', replacement: 'Mr. Johnson', room: '101', notes: 'Bring textbook' },
    { id: 2, date: '2023-10-30', className: '11B', period: 3, subject: 'Physics', teacher: 'Mr. Davis', replacement: 'Ms. Thompson', room: '204', notes: 'Group project continues' },
    { id: 3, date: '2023-10-30', className: '12C', period: 5, subject: 'English', teacher: 'Ms. Wilson', replacement: 'Mr. Brown', room: '303', notes: 'Essay review' },
    { id: 4, date: '2023-10-31', className: '9D', period: 2, subject: 'History', teacher: 'Mr. Harris', replacement: 'Mrs. Miller', room: '105', notes: 'Quiz postponed' },
    { id: 5, date: '2023-10-31', className: '10E', period: 4, subject: 'Chemistry', teacher: 'Mrs. Clark', replacement: 'Mr. White', room: '208', notes: 'Lab safety review' },
];

interface TimeTable {
    uuid: string;
    groupName: string;
    date: string;
    title: string;
    detail: string;
}

const SubstitutionPlan = () => {
    const [timeTables, setTimeTables] = useState<TimeTable[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTimeTables = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:8080/api/substitution/plans');
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                const data = await response.json();
                setTimeTables(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch timetables:', err);
                setError('Failed to load substitution plan. Using mock data instead.');
            } finally {
                setLoading(false);
            }
        };

        fetchTimeTables();
    }, []);

    // Group time tables by date
    const groupedTimeTables = timeTables.reduce((acc, table) => {
        const date = table.date.split('T')[0]; // Extract date part only
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(table);
        return acc;
    }, {} as Record<string, TimeTable[]>);

    return (
        <div className="mb-4">
            <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">
                Substitution Plan
                {loading && <span className="ml-2 text-sm font-normal text-gray-500">(Loading...)</span>}
            </h2>

            {error && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 mb-4 rounded">
                    {error}
                </div>
            )}

            {/* Real DSB Data */}
            {!loading && !error && Object.keys(groupedTimeTables).length > 0 ? (
                Object.keys(groupedTimeTables).map(date => (
                    <div key={date} className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">
                            {new Date(date).toLocaleDateString(undefined, { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse mt-2">
                                <thead>
                                    <tr>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Group</th>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Title</th>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Detail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedTimeTables[date].map((table, index) => (
                                        <tr key={table.uuid} className="even:bg-gray-100">
                                            <td className="border border-gray-300 px-4 py-2">{table.groupName}</td>
                                            <td className="border border-gray-300 px-4 py-2">{table.title}</td>
                                            <td className="border border-gray-300 px-4 py-2">{table.detail}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            ) : (
                // Show mock data if no real data is available
                !loading && (
                    <>
                        <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">Mock Data</h2>

                        {['2023-10-30', '2023-10-31'].map(date => (
                            <div key={date} className="mb-6">
                                <h3 className="text-lg font-semibold mb-2">
                                    {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse mt-2">
                                        <thead>
                                            <tr>
                                                <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Class</th>
                                                <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Period</th>
                                                <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Subject</th>
                                                <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Regular Teacher</th>
                                                <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Substitute</th>
                                                <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Room</th>
                                                <th className="bg-blue-500 text-white border border-gray-300 px-4 py-2 text-left">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mockSubstitutions
                                                .filter(sub => sub.date === date)
                                                .map(sub => (
                                                    <tr key={sub.id} className="even:bg-gray-100">
                                                        <td className="border border-gray-300 px-4 py-2">{sub.className}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{sub.period}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{sub.subject}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{sub.teacher}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{sub.replacement}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{sub.room}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{sub.notes}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </>
                )
            )}
        </div>
    );
};

export default SubstitutionPlan;