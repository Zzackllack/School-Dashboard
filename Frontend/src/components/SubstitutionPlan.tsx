import React from 'react';

// Mock data - would be replaced with real data in a production environment
const mockSubstitutions = [
    { id: 1, date: '2023-10-30', className: '10A', period: 1, subject: 'Math', teacher: 'Mrs. Smith', replacement: 'Mr. Johnson', room: '101', notes: 'Bring textbook' },
    { id: 2, date: '2023-10-30', className: '11B', period: 3, subject: 'Physics', teacher: 'Mr. Davis', replacement: 'Ms. Thompson', room: '204', notes: 'Group project continues' },
    { id: 3, date: '2023-10-30', className: '12C', period: 5, subject: 'English', teacher: 'Ms. Wilson', replacement: 'Mr. Brown', room: '303', notes: 'Essay review' },
    { id: 4, date: '2023-10-31', className: '9D', period: 2, subject: 'History', teacher: 'Mr. Harris', replacement: 'Mrs. Miller', room: '105', notes: 'Quiz postponed' },
    { id: 5, date: '2023-10-31', className: '10E', period: 4, subject: 'Chemistry', teacher: 'Mrs. Clark', replacement: 'Mr. White', room: '208', notes: 'Lab safety review' },
];

const SubstitutionPlan = () => {
    return (
        <div className="mb-4">
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

            <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">Real Data - Implementation later over API</h2>
            <div className="flex">
                <iframe src="https://dsbmobile.de/data/ba59f8c2-a3a5-49eb-9b00-c3a61e92cb5f/20eb7be3-dc7a-4101-af34-8123e41831a1/subst_001.htm" className="w-1/2 h-[500px]" sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation" />
                <iframe src="https://dsbmobile.de/data/ba59f8c2-a3a5-49eb-9b00-c3a61e92cb5f/4aa9d55c-1980-4842-beec-004471479739/subst_001.htm" className="w-1/2 h-[500px]" sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation" />
            </div>
        </div>
    );
};

export default SubstitutionPlan;