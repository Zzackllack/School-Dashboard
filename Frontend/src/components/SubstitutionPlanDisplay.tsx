import { useState, useEffect } from 'react';
import { X, Replace, ArrowRightSquare, ArrowDownUp, BookOpen, Info, Calendar } from 'lucide-react'; // Add Calendar icon for events

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

    // Define hardcoded color mapping for each class with modern look
    const getClassColor = (classname: string): string => {
        // Clean up the class name (trim whitespace and convert to lowercase)
        const cleanClassName = classname.trim().toLowerCase();
        
        // Define specific colors for each class with a modern, translucent look
        const classColors: Record<string, string> = {
            // 7th grade - warmer tones
            '7a': 'bg-red-50/80 backdrop-blur-sm',
            '7b': 'bg-rose-50/80 backdrop-blur-sm',
            '7c': 'bg-pink-50/80 backdrop-blur-sm',
            '7d': 'bg-fuchsia-50/80 backdrop-blur-sm',
            
            // 8th grade - cool tones
            '8a': 'bg-blue-50/80 backdrop-blur-sm',
            '8b': 'bg-sky-50/80 backdrop-blur-sm',
            '8c': 'bg-cyan-50/80 backdrop-blur-sm',
            '8d': 'bg-indigo-50/80 backdrop-blur-sm',
            
            // 9th grade - earthy tones
            '9a': 'bg-green-50/80 backdrop-blur-sm',
            '9b': 'bg-emerald-50/80 backdrop-blur-sm',
            '9c': 'bg-teal-50/80 backdrop-blur-sm',
            '9d': 'bg-lime-50/80 backdrop-blur-sm',
            
            // 10th grade - warm neutrals
            '10a': 'bg-yellow-50/80 backdrop-blur-sm',
            '10b': 'bg-amber-50/80 backdrop-blur-sm',
            '10c': 'bg-orange-50/80 backdrop-blur-sm',
            '10d': 'bg-yellow-50/80 backdrop-blur-sm',
            
            // Upper grades - distinctive
            '11': 'bg-purple-50/80 backdrop-blur-sm',
            '12': 'bg-slate-50/80 backdrop-blur-sm'
        };
        
        // Check if this entry has multiple classes (comma or space separated)
        if (cleanClassName.includes(',') || /\s+/.test(cleanClassName)) {
            // For entries with multiple classes, use a distinctive glass effect
            return 'bg-gradient-to-r from-gray-50/70 to-slate-50/70 backdrop-blur-md';
        }
        
        // Return the color for this class, or a default color if not found
        return classColors[cleanClassName] || 'bg-gray-50/80 backdrop-blur-sm';
    };

    // Map to keep track of used classes for each plan
    const getClassesInPlan = (plan: SubstitutionPlan): string[] => {
        // Extract unique class names from plan entries
        const classesSet = new Set<string>();
        plan.entries.forEach(entry => {
            // Split multi-class entries (e.g. "10a, 10b" -> ["10a", "10b"])
            const classes = entry.classes.split(/[,\s]+/).filter(Boolean);
            classes.forEach(cls => classesSet.add(cls.trim()));
        });
        return Array.from(classesSet).sort((a, b) => {
            // Sort classes: first by grade number, then by section letter
            const gradeA = parseInt(a.match(/\d+/)?.[0] || '0');
            const gradeB = parseInt(b.match(/\d+/)?.[0] || '0');
            
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.localeCompare(b);
        });
    };

    // Function to render type cell with conditional styling
    const renderTypeCell = (type: string) => {
        if (type.toLowerCase() === "entfall" || type.toLowerCase() === "ausfall") {
            return (
                <div className="flex items-center text-red-600 font-medium">
                    <X size={16} className="mr-1" />
                    {type}
                </div>
            );
        }
        
        if (type.toLowerCase() === "vertr." || type.toLowerCase().includes("vertretung") || type.toLowerCase().includes("s. vertr.")) {
            return (
                <div className="flex items-center text-amber-600 font-medium">
                    <Replace size={16} className="mr-1" />
                    {type}
                </div>
            );
        }
        
        if (type.toLowerCase() === "raumänd." || type.toLowerCase().includes("raum") || type.toLowerCase().includes("raumänderung")) {
            return (
                <div className="flex items-center text-green-600 font-medium">
                    <ArrowRightSquare size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        if (type.toLowerCase() === "verlegung" || type.toLowerCase().includes("verleg")) {
            return (
                <div className="flex items-center text-green-600 font-medium">
                    <ArrowDownUp size={16} className="mr-1" />
                    {type}
                </div>
            );
        }
        
        if (type.toLowerCase() === "eva" || type.toLowerCase().includes("eigenverantwort")) {
            return (
                <div className="flex items-center text-indigo-600 font-medium">
                    <BookOpen size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        if (type.toLowerCase() === "veranst." || type.toLowerCase().includes("veranstaltung") || type.toLowerCase().includes("belehrung")) {
            return (
                <div className="flex items-center text-purple-600 font-medium">
                    <Calendar size={16} className="mr-1" />
                    {type}
                </div>
            );
        }
        
        return <span className="text-gray-800">{type}</span>;
    };

    return (
        <div className="w-full">
            <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-5 mb-5 w-full transition-all duration-300">
                <h2 className="text-2xl font-bold text-gray-800">
                    Substitution Plans
                    {loading && <span className="ml-2 text-sm font-normal text-gray-500">(Loading...)</span>}
                </h2>

                {error && (
                    <div className="bg-[#F5E1DA] border border-[#A45D5D] text-[#A45D5D] px-4 py-3 mb-4 rounded">
                        {error}
                    </div>
                )}

                {!loading && substitutionPlans.length === 0 && !error && (
                    <div className="bg-[#F5EFD7] border border-[#DDB967] text-[#8C7356] px-4 py-3 rounded">
                        No substitution plans available at the moment.
                    </div>
                )}
            </div>

            {/* Each day gets its own container */}
            {substitutionPlans.map((plan, planIndex) => (
                <div key={planIndex} className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-5 mb-5 w-full transition-all duration-300 hover:shadow-xl">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                        {formatDate(plan.date)}
                    </h3>

                    {/* Display Daily News if available */}
                    {plan.news && plan.news.newsItems && plan.news.newsItems.length > 0 && (
                        <div className="mb-6 p-4 bg-amber-50/70 backdrop-blur-sm border-l-4 border-amber-300 rounded-lg w-full shadow-sm">
                            <h4 className="text-lg font-medium text-amber-800 mb-2 flex items-center">
                                <Info size={20} className="mr-2 text-amber-600" /> 
                                Nachrichten zum Tag
                            </h4>
                            {plan.news.newsItems.map((newsItem, idx) => (
                                <p key={idx} className="mb-2 text-gray-700">{newsItem}</p>
                            ))}
                        </div>
                    )}

                    {plan.entries.length > 0 ? (
                        <>
                            {/* Class legend */}
                            <div className="mb-5 flex flex-wrap gap-2">
                                {getClassesInPlan(plan).map((className, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`${getClassColor(className)} px-3 py-1.5 border border-white/30 rounded-full text-sm shadow-sm hover:shadow transition duration-300 ease-in-out`}
                                    >
                                        {className}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="overflow-x-auto w-full">
                                <table className="min-w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="bg-gray-700/90 text-white backdrop-blur-md border-b border-white/10 px-4 py-3 text-left rounded-tl-lg">Class</th>
                                            <th className="bg-gray-700/90 text-white backdrop-blur-md border-b border-white/10 px-4 py-3 text-left">Period</th>
                                            <th className="bg-gray-700/90 text-white backdrop-blur-md border-b border-white/10 px-4 py-3 text-left">Absent</th>
                                            <th className="bg-gray-700/90 text-white backdrop-blur-md border-b border-white/10 px-4 py-3 text-left">Substitute</th>
                                            <th className="bg-gray-700/90 text-white backdrop-blur-md border-b border-white/10 px-4 py-3 text-left">Original Subject</th>
                                            <th className="bg-gray-700/90 text-white backdrop-blur-md border-b border-white/10 px-4 py-3 text-left">New Subject</th>
                                            <th className="bg-gray-700/90 text-white backdrop-blur-md border-b border-white/10 px-4 py-3 text-left">Room</th>
                                            <th className="bg-gray-700/90 text-white backdrop-blur-md border-b border-white/10 px-4 py-3 text-left">Type</th>
                                            <th className="bg-gray-700/90 text-white backdrop-blur-md border-b border-white/10 px-4 py-3 text-left rounded-tr-lg">Comments</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.entries.map((entry, entryIndex) => {
                                            // Get class-specific background color
                                            const classColor = getClassColor(entry.classes);
                                            
                                            return (
                                                <tr 
                                                    key={entryIndex} 
                                                    className={`${classColor} hover:bg-opacity-100 transition duration-300 ease-in-out`}
                                                >
                                                    <td className="border-b border-gray-100/30 px-4 py-3 font-medium">{entry.classes}</td>
                                                    <td className="border-b border-gray-100/30 px-4 py-3">{entry.period}</td>
                                                    <td className="border-b border-gray-100/30 px-4 py-3">{entry.absent}</td>
                                                    <td className="border-b border-gray-100/30 px-4 py-3">{entry.substitute}</td>
                                                    <td className="border-b border-gray-100/30 px-4 py-3">{entry.originalSubject}</td>
                                                    <td className="border-b border-gray-100/30 px-4 py-3">{entry.subject}</td>
                                                    <td className="border-b border-gray-100/30 px-4 py-3">{entry.newRoom}</td>
                                                    <td className="border-b border-gray-100/30 px-4 py-3">{renderTypeCell(entry.type)}</td>
                                                    <td className="border-b border-gray-100/30 px-4 py-3">{entry.comment}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <p className="italic text-gray-500">No substitutions available for this date.</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SubstitutionPlanDisplay;
