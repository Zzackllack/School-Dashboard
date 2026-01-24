import { useEffect, useState } from 'react';

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
    const [currentPage, setCurrentPage] = useState(0);
    const [showNews, setShowNews] = useState(false);

    useEffect(() => {
        const fetchSubstitutionPlans = async () => {
            setLoading(true);

            try {
                const backendUrl =
                    import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

                const response = await fetch(
                    `${backendUrl}/api/substitution/plans`
                );

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data: SubstitutionPlan[] = await response.json();
                setSubstitutionPlans(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch substitution plans:', err);
                setError('Vertretungspläne konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubstitutionPlans();
    }, []);

    const getGradeNumber = (classes: string): number => {
        const match = classes.match(/(\d+)/);
        return match ? parseInt(match[1]) : 99;
    };

    const getPeriodNumber = (period: string): number => {
        const match = period.match(/(\d+)/);
        return match ? parseInt(match[1]) : 99;
    };

    const todayPlans = substitutionPlans;

    const allEntries = todayPlans
        .flatMap(plan =>
            plan.entries.map(entry => ({
                ...entry,
                planDate: plan.date,
            }))
        )
        .sort((a, b) => {
            const gradeA = getGradeNumber(a.classes);
            const gradeB = getGradeNumber(b.classes);

            if (gradeA !== gradeB) return gradeA - gradeB;

            const periodA = getPeriodNumber(a.period);
            const periodB = getPeriodNumber(b.period);

            return periodA - periodB;
        });

    const allNews = todayPlans
        .filter(
            plan =>
                plan.news &&
                plan.news.newsItems &&
                plan.news.newsItems.length > 0
        )
        .flatMap(plan => plan.news.newsItems);

    const totalPages = Math.ceil(allEntries.length / 16);
    const currentEntries = allEntries.slice(
        currentPage * 16,
        (currentPage + 1) * 16
    );

    const hasNews = allNews.length > 0;
    const totalSlides = hasNews ? totalPages + 1 : totalPages;

    useEffect(() => {
        if (totalSlides <= 1 && !hasNews) return;

        const interval = setInterval(() => {
            if (showNews) {
                setShowNews(false);
                setCurrentPage(0);
            } else if (currentPage >= totalPages - 1 && hasNews) {
                setShowNews(true);
            } else {
                setCurrentPage(prev => (prev + 1) % totalPages);
            }
        }, 12000);

        return () => clearInterval(interval);
    }, [totalPages, totalSlides, hasNews, showNews, currentPage]);

    const getTypeColor = (type: string): string => {
        const t = type.toLowerCase();

        if (t === 'entfall' || t === 'ausfall') return '#ef4444';
        if (t === 'vertr.' || t.includes('vertretung') || t.includes('s. vertr.'))
            return '#f59e0b';
        if (t === 'raumänd.' || t.includes('raum')) return '#22c55e';
        if (t === 'verlegung' || t.includes('verleg')) return '#22c55e';
        if (t === 'eva' || t.includes('eigenverantwort'))
            return '#8b5cf6';
        if (t === 'veranst.' || t.includes('veranstaltung'))
            return '#a855f7';
        if (t === 'unterricht geändert' || t.includes('geändert'))
            return '#3b82f6';
        if (t === 'mitbetr.' || t.includes('mitbetreuung'))
            return '#22c55e';

        return '#6b7280';
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl text-gray-600 dark:text-gray-300 font-bold">
                    Laden...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-xl text-red-500 font-bold">
                    {error}
                </span>
            </div>
        );
    }

    if (allEntries.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl text-gray-600 dark:text-gray-300 font-bold">
                    Keine Vertretungen für heute
                </span>
            </div>
        );
    }

    if (showNews && hasNews) {
        return (
            <div className="w-full h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                    <div className="flex flex-col items-center justify-center p-8 overflow-hidden">
                        <h2 className="text-4xl font-medium text-gray-800 dark:text-white mb-6 flex-shrink-0">
                            Nachrichten des Tages
                        </h2>

                        <div className="space-y-4 text-center max-w-7xl overflow-hidden flex-1 px-4">
                            {allNews.map((news, idx) => (
                                <p
                                    key={idx}
                                    className="text-3xl text-gray-700 dark:text-gray-200 leading-relaxed"
                                >
                                    {news}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-3">
                {currentEntries.map((entry, index) => (
                    <div
                        key={index}
                        className="flex items-stretch rounded-2xl backdrop-blur-sm bg-gradient-to-br from-gray-50/40 to-gray-100/40 dark:from-gray-700/40 dark:to-gray-800/40 border border-gray-200/50 dark:border-gray-600/50 shadow-lg overflow-hidden"
                    >
                        <div className="flex items-center gap-5 px-4">

                            <span className="text-4xl font-medium text-gray-800 dark:text-white">
                                {entry.period}
                            </span>

                            <div className="flex items-center justify-center rounded-2xl px-4 py-3 bg-[#2d5a7b]">
                                <span className="text-2xl font-bold text-white">
                                    {entry.classes}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center px-3">
                            <span className="text-2xl font-semibold text-gray-800 dark:text-white">
                                {entry.substitute || entry.absent || '—'}
                            </span>

                            <span className="text-xl text-gray-600 dark:text-gray-300">
                                {entry.subject ||
                                    entry.originalSubject ||
                                    '—'}
                            </span>
                        </div>

                        <div
                            className="w-14 flex items-center justify-center rounded-r-2xl"
                            style={{
                                backgroundColor: getTypeColor(entry.type),
                            }}
                        >
                            <span
                                className="text-xl font-bold text-white uppercase"
                                style={{
                                    writingMode: 'vertical-rl',
                                    textOrientation: 'mixed',
                                }}
                            >
                                {entry.type}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/*\/ Zeigt den aktuellen Slide an, verzieht aber das design und es geht eigentlich auch ohne*/}

            {/*{totalSlides > 1 && (*/}
            {/*    <div className="flex justify-center gap-2 pt-3">*/}
            {/*        {Array.from({ length: totalSlides }).map((_, i) => (*/}
            {/*            <div*/}
            {/*                key={i}*/}
            {/*                className={`w-2 h-2 rounded-full ${*/}
            {/*                    (!showNews && i === currentPage) ||*/}
            {/*                    (showNews && i === totalSlides - 1)*/}
            {/*                        ? 'bg-gray-700 dark:bg-white'*/}
            {/*                        : 'bg-gray-400 dark:bg-gray-500'*/}
            {/*                }`}*/}
            {/*            />*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    );
};

export default SubstitutionPlanDisplay;