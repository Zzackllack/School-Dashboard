import { useState, useEffect } from 'react';

interface SubstitutionEntry {
    classes: string;
    period: string;
    absent: string;
    substitute: string;
    originalSubject: string;
    subject: string;
    newRoom: string;
    type: string;
    comment: string;
    date: string;
}

interface DailyNews {
    date: string;
    newsItems: string[];
}

interface SubstitutionPlan {
    date: string;
    title: string;
    entries: SubstitutionEntry[];
    news: DailyNews;
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
        <div className="w-full p-4">
            <h2 className="text-xl font-bold text-[#8C7356] border-b border-gray-200 pb-2 mb-4">
                Vertretungspläne
                {loading && <span className="ml-2 text-sm font-normal text-gray-500">(Ladevorgang...)</span>}
            </h2>

            {error && (
                <div className="bg-[#F5E1DA] border border-[#A45D5D] text-[#A45D5D] px-4 py-3 mb-4 rounded">
                    {error}
                </div>
            )}

            {!loading && substitutionPlans.length === 0 && !error && (
                <div className="bg-[#F5EFD7] border border-[#DDB967] text-[#8C7356] px-4 py-3 rounded">
                    Keine Vertretungen für dieses Datum verfügbar.
                </div>
            )}

            {substitutionPlans.map((plan, planIndex) => (
                <div key={planIndex} className="mb-8 w-full">
                    <h3 className="text-lg font-semibold mb-2 text-[#3E3128]">
                        {formatDate(plan.date)}
                    </h3>

                    {/* Display Daily News if available */}
                    {plan.news && plan.news.newsItems && plan.news.newsItems.length > 0 && (
                        <div className="mb-6 p-4 bg-[#F2E3C6] border-l-4 border-[#D4A76A] rounded w-full">
                            <h4 className="text-lg font-medium text-[#8C7356] mb-2">Nachrichten zum Tag</h4>
                            {plan.news.newsItems.map((newsItem, idx) => (
                                <p key={idx} className="mb-2 text-[#3E3128]">{newsItem}</p>
                            ))}
                        </div>
                    )}

                    {plan.entries.length > 0 ? (
                        <div className="overflow-x-auto w-full">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-[#D4A76A] text-white border border-[#E8C897] px-3 py-2 text-left">Klasse</th>
                                        <th className="bg-[#D4A76A] text-white border border-[#E8C897] px-3 py-2 text-left">Stunde</th>
                                        <th className="bg-[#D4A76A] text-white border border-[#E8C897] px-3 py-2 text-left">Abwesend</th>
                                        <th className="bg-[#D4A76A] text-white border border-[#E8C897] px-3 py-2 text-left">Vertreter</th>
                                        <th className="bg-[#D4A76A] text-white border border-[#E8C897] px-3 py-2 text-left">Ürsprüngliches Fach</th>
                                        <th className="bg-[#D4A76A] text-white border border-[#E8C897] px-3 py-2 text-left">Neues Fach</th>
                                        <th className="bg-[#D4A76A] text-white border border-[#E8C897] px-3 py-2 text-left">Raum</th>
                                        <th className="bg-[#D4A76A] text-white border border-[#E8C897] px-3 py-2 text-left">Typ</th>
                                        <th className="bg-[#D4A76A] text-white border border-[#E8C897] px-3 py-2 text-left">Kommentare</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.entries.map((entry, entryIndex) => (
                                        <tr key={entryIndex} className={entryIndex % 2 === 0 ? 'bg-white' : 'bg-[#F8F4E8]'}>
                                            <td className="border border-[#E8C897] px-3 py-2">{entry.classes}</td>
                                            <td className="border border-[#E8C897] px-3 py-2">{entry.period}</td>
                                            <td className="border border-[#E8C897] px-3 py-2">{entry.absent}</td>
                                            <td className="border border-[#E8C897] px-3 py-2">{entry.substitute}</td>
                                            <td className="border border-[#E8C897] px-3 py-2">{entry.originalSubject}</td>
                                            <td className="border border-[#E8C897] px-3 py-2">{entry.subject}</td>
                                            <td className="border border-[#E8C897] px-3 py-2">{entry.newRoom}</td>
                                            <td className="border border-[#E8C897] px-3 py-2">{entry.type}</td>
                                            <td className="border border-[#E8C897] px-3 py-2">{entry.comment}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="italic text-[#5A4635]">Keine Vertretungen für dieses Datum verfügbar.</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SubstitutionPlanDisplay;
