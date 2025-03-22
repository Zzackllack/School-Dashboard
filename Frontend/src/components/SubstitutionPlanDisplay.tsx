import { useState, useEffect } from 'react';

interface SubstitutionEntry {
    classes: string;
    period: string;
    absent: string;
    substitute: string;
    subject: string;
    newRoom: string;
    type: string;
    comment: string;
    date: string;
}

interface SubstitutionPlan {
    date: string;
    title: string;
    entries: SubstitutionEntry[];
}

const SubstitutionPlanDisplay = () => {
    const [substitutionPlans, setSubstitutionPlans] = useState<SubstitutionPlan[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubstitutionPlans = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:8080/api/substitution/plans');
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                const data: SubstitutionPlan[] = await response.json();
                setSubstitutionPlans(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch substitution plans:', err);
                setError('Failed to load substitution plans.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubstitutionPlans();
    }, []);

    // Format date from "DD.MM.YYYY Day" to a more readable format
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        
        // Extract and parse components if it matches the expected format
        const match = dateString.match(/(\d+\.\d+\.\d+)\s+(\w+)/);
        if (match) {
            const [, date, day] = match;
            return `${day}, ${date}`;
        }
        
        return dateString;
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">
                Substitution Plans
                {loading && <span className="ml-2 text-sm font-normal text-gray-500">(Loading...)</span>}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
                    {error}
                </div>
            )}

            {!loading && substitutionPlans.length === 0 && !error && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    No substitution plans available at the moment.
                </div>
            )}

            {substitutionPlans.map((plan, planIndex) => (
                <div key={planIndex} className="mb-8">
                    <h3 className="text-lg font-semibold mb-2">
                        {formatDate(plan.date)}
                    </h3>
                    {plan.title && <p className="mb-2 text-gray-600">{plan.title}</p>}

                    {plan.entries.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Class</th>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Period</th>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Absent</th>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Substitute</th>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Subject</th>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Room</th>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Type</th>
                                        <th className="bg-blue-500 text-white border border-gray-300 px-3 py-2 text-left">Comments</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.entries.map((entry, entryIndex) => (
                                        <tr key={entryIndex} className={entryIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-gray-300 px-3 py-2">{entry.classes}</td>
                                            <td className="border border-gray-300 px-3 py-2">{entry.period}</td>
                                            <td className="border border-gray-300 px-3 py-2">{entry.absent}</td>
                                            <td className="border border-gray-300 px-3 py-2">{entry.substitute}</td>
                                            <td className="border border-gray-300 px-3 py-2">{entry.subject}</td>
                                            <td className="border border-gray-300 px-3 py-2">{entry.newRoom}</td>
                                            <td className="border border-gray-300 px-3 py-2">{entry.type}</td>
                                            <td className="border border-gray-300 px-3 py-2">{entry.comment}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="italic text-gray-500">No substitutions available for this date.</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SubstitutionPlanDisplay;
