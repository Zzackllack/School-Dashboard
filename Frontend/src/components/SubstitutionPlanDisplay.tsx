import { ArrowDownUp, ArrowRightSquare, BookOpen, Calendar, Info, PenLine, Replace, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type GradeKey = '7' | '8' | '9' | '10' | '11' | '12';

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

const gradeOrder: GradeKey[] = ['7', '8', '9', '10', '11', '12'];

const gradeStyles: Record<GradeKey, { label: string; container: string; heading: string; badge: string; tableHeader: string; row: string }> = {
    '7': {
        label: '7. Jahrgang',
        container: 'bg-rose-50/70 border-rose-200',
        heading: 'text-rose-900',
        badge: 'text-rose-700 bg-rose-100',
        tableHeader: 'bg-rose-700/90',
        row: 'odd:bg-white/70 even:bg-rose-50/60',
    },
    '8': {
        label: '8. Jahrgang',
        container: 'bg-amber-50/70 border-amber-200',
        heading: 'text-amber-900',
        badge: 'text-amber-700 bg-amber-100',
        tableHeader: 'bg-amber-700/90',
        row: 'odd:bg-white/70 even:bg-amber-50/60',
    },
    '9': {
        label: '9. Jahrgang',
        container: 'bg-emerald-50/70 border-emerald-200',
        heading: 'text-emerald-900',
        badge: 'text-emerald-700 bg-emerald-100',
        tableHeader: 'bg-emerald-700/90',
        row: 'odd:bg-white/70 even:bg-emerald-50/60',
    },
    '10': {
        label: '10. Jahrgang',
        container: 'bg-sky-50/70 border-sky-200',
        heading: 'text-sky-900',
        badge: 'text-sky-700 bg-sky-100',
        tableHeader: 'bg-sky-700/90',
        row: 'odd:bg-white/70 even:bg-sky-50/60',
    },
    '11': {
        label: '11. Jahrgang',
        container: 'bg-teal-50/70 border-teal-200',
        heading: 'text-teal-900',
        badge: 'text-teal-700 bg-teal-100',
        tableHeader: 'bg-teal-700/90',
        row: 'odd:bg-white/70 even:bg-teal-50/60',
    },
    '12': {
        label: '12. Jahrgang',
        container: 'bg-slate-50/70 border-slate-200',
        heading: 'text-slate-900',
        badge: 'text-slate-700 bg-slate-100',
        tableHeader: 'bg-slate-700/90',
        row: 'odd:bg-white/70 even:bg-slate-50/60',
    },
};

const SubstitutionPlanDisplay = () => {
    const [substitutionPlans, setSubstitutionPlans] = useState<SubstitutionPlan[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubstitutionPlans = async () => {
            setLoading(true);
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
                const response = await fetch(`${backendUrl}/api/substitution/plans`);
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                const data: SubstitutionPlan[] = await response.json();
                setSubstitutionPlans(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch substitution plans:', err);
                setError('Vertretungspläne konnten nicht geladen werden. Bitte versuche es später erneut, oder kontaktiere Cédric.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubstitutionPlans();
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const match = dateString.match(/(\d+\.\d+\.\d+)\s+(\w+)/);
        if (match) {
            const [, date, day] = match;
            return `${day}, ${date}`;
        }
        return dateString;
    };

    const isTodayPlan = (plan: SubstitutionPlan, today: Date) => {
        if (!plan.date) return false;
        const lower = plan.date.toLowerCase();
        if (lower.includes('heute')) return true;
        if (lower.includes('morgen')) return false;
        const match = plan.date.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (!match) return false;
        const [, day, month, year] = match;
        return (
            Number(day) === today.getDate() &&
            Number(month) === today.getMonth() + 1 &&
            Number(year) === today.getFullYear()
        );
    };

    const extractGrades = (classes: string): GradeKey[] => {
        const normalized = classes.toLowerCase().replace(/[,/]+/g, ' ');
        const tokens = normalized.split(/\s+/).filter(Boolean);
        const grades = new Set<GradeKey>();

        tokens.forEach((token) => {
            const cleaned = token.replace(/[^a-z0-9]/gi, '');
            const gradeMatch = cleaned.match(/^(7|8|9|10|11|12)([a-z])?$/);
            if (gradeMatch) {
                grades.add(gradeMatch[1] as GradeKey);
                return;
            }
            const qMatch = cleaned.match(/^q([1-4])$/);
            if (qMatch) {
                const qStage = Number(qMatch[1]);
                grades.add(qStage <= 2 ? '11' : '12');
            }
        });

        return Array.from(grades);
    };

    const today = useMemo(() => new Date(), []);

    const todayPlans = useMemo(
        () => substitutionPlans.filter((plan) => isTodayPlan(plan, today)),
        [substitutionPlans, today],
    );

    const todayEntries = useMemo(
        () => todayPlans.flatMap((plan) => plan.entries || []),
        [todayPlans],
    );

    const newsItems = useMemo(() => {
        const items = todayPlans.flatMap((plan) => plan.news?.newsItems ?? []);
        return Array.from(new Set(items));
    }, [todayPlans]);

    const groupedEntries = useMemo(() => {
        const grouped: Record<GradeKey, SubstitutionEntry[]> = {
            '7': [],
            '8': [],
            '9': [],
            '10': [],
            '11': [],
            '12': [],
        };

        todayEntries.forEach((entry) => {
            const grades = extractGrades(entry.classes);
            if (grades.length === 0) return;
            grades.forEach((grade) => grouped[grade].push(entry));
        });

        return grouped;
    }, [todayEntries]);

    const renderTypeCell = (type: string) => {
        if (type.toLowerCase() === 'entfall' || type.toLowerCase() === 'ausfall') {
            return (
                <div className="flex items-center text-red-600 font-medium">
                    <X size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        if (type.toLowerCase() === 'vertr.' || type.toLowerCase().includes('vertretung') || type.toLowerCase().includes('s. vertr.')) {
            return (
                <div className="flex items-center text-amber-600 font-medium">
                    <Replace size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        if (type.toLowerCase() === 'raumänd.' || type.toLowerCase().includes('raum') || type.toLowerCase().includes('raumänderung')) {
            return (
                <div className="flex items-center text-green-600 font-medium">
                    <ArrowRightSquare size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        if (type.toLowerCase() === 'verlegung' || type.toLowerCase().includes('verleg')) {
            return (
                <div className="flex items-center text-green-600 font-medium">
                    <ArrowDownUp size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        if (type.toLowerCase() === 'eva' || type.toLowerCase().includes('eigenverantwort')) {
            return (
                <div className="flex items-center text-indigo-600 font-medium">
                    <BookOpen size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        if (type.toLowerCase() === 'veranst.' || type.toLowerCase().includes('veranstaltung')) {
            return (
                <div className="flex items-center text-slate-600 font-medium">
                    <Calendar size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        if (type.toLowerCase() === 'unterricht geändert' || type.toLowerCase().includes('geändert')) {
            return (
                <div className="flex items-center text-blue-600 font-medium">
                    <PenLine size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        if (type.toLowerCase() === 'mitbetr.' || type.toLowerCase().includes('mitbetreuung')) {
            return (
                <div className="flex items-center text-green-600 font-medium">
                    <Users size={16} className="mr-1" />
                    {type}
                </div>
            );
        }

        return <span className="text-gray-800">{type}</span>;
    };

    const headerDate = todayPlans.length > 0
        ? formatDate(todayPlans[0].date)
        : today.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
      <div className="w-full h-full flex flex-col min-h-0">
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-4 mb-4 w-full transition-all duration-300">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-2xl font-bold text-gray-800">
              Vertretungsplan heute
              {loading && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Laden...)
                </span>
              )}
            </h2>
            <span className="text-sm text-gray-600 font-medium">
              {headerDate}
            </span>
          </div>

          {error && (
            <div className="bg-[#F5E1DA] border border-[#A45D5D] text-[#A45D5D] px-4 py-3 mt-3 rounded">
              {error}
            </div>
          )}

          {!loading && todayPlans.length === 0 && !error && (
            <div className="bg-[#F5EFD7] border border-[#DDB967] text-[#8C7356] px-4 py-3 mt-3 rounded">
              Keine Vertretungspläne für heute verfügbar.
            </div>
          )}

          {newsItems.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50/70 backdrop-blur-sm border-l-4 border-amber-300 rounded-lg w-full shadow-sm">
              <h4 className="text-lg font-medium text-amber-800 mb-2 flex items-center">
                <Info size={20} className="mr-2 text-amber-600" />
                Nachrichten zum Tag
              </h4>
              {newsItems.map((newsItem, idx) => (
                <p key={idx} className="mb-2 text-gray-700">
                  {newsItem}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden items-start">
          {" "}
          {gradeOrder.map((grade) => {
            const entries = groupedEntries[grade];
            const styles = gradeStyles[grade];

            return (
              <div
                key={grade}
                className={`rounded-xl border shadow-md p-3 flex flex-col min-h-0 max-h-full overflow-hidden self-start ${styles.container}`}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h3 className={`text-lg font-semibold ${styles.heading}`}>
                    {styles.label}
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${styles.badge}`}
                  >
                    {entries.length} Einträge
                  </span>
                </div>

                {entries.length > 0 ? (
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th
                            className={`${styles.tableHeader} text-white backdrop-blur-md border-b border-white/10 px-3 py-2 text-left rounded-tl-lg`}
                          >
                            Klasse
                          </th>
                          <th
                            className={`${styles.tableHeader} text-white backdrop-blur-md border-b border-white/10 px-3 py-2 text-left`}
                          >
                            Stunde
                          </th>
                          <th
                            className={`${styles.tableHeader} text-white backdrop-blur-md border-b border-white/10 px-3 py-2 text-left`}
                          >
                            Fehlenend
                          </th>
                          <th
                            className={`${styles.tableHeader} text-white backdrop-blur-md border-b border-white/10 px-3 py-2 text-left`}
                          >
                            Vertreter
                          </th>
                          <th
                            className={`${styles.tableHeader} text-white backdrop-blur-md border-b border-white/10 px-3 py-2 text-left`}
                          >
                            Originales Fach
                          </th>
                          <th
                            className={`${styles.tableHeader} text-white backdrop-blur-md border-b border-white/10 px-3 py-2 text-left`}
                          >
                            Neues Fach
                          </th>
                          <th
                            className={`${styles.tableHeader} text-white backdrop-blur-md border-b border-white/10 px-3 py-2 text-left`}
                          >
                            Raum
                          </th>
                          <th
                            className={`${styles.tableHeader} text-white backdrop-blur-md border-b border-white/10 px-3 py-2 text-left`}
                          >
                            Typ
                          </th>
                          <th
                            className={`${styles.tableHeader} text-white backdrop-blur-md border-b border-white/10 px-3 py-2 text-left rounded-tr-lg`}
                          >
                            Kommentare
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry, entryIndex) => (
                          <tr
                            key={`${entry.classes}-${entry.period}-${entryIndex}`}
                            className={`${styles.row} hover:bg-opacity-100 transition duration-300 ease-in-out`}
                          >
                            <td className="border-b border-gray-100/30 px-3 py-2 font-medium">
                              {entry.classes}
                            </td>
                            <td className="border-b border-gray-100/30 px-3 py-2">
                              {entry.period}
                            </td>
                            <td className="border-b border-gray-100/30 px-3 py-2">
                              {entry.absent}
                            </td>
                            <td className="border-b border-gray-100/30 px-3 py-2">
                              {entry.substitute}
                            </td>
                            <td className="border-b border-gray-100/30 px-3 py-2">
                              {entry.originalSubject}
                            </td>
                            <td className="border-b border-gray-100/30 px-3 py-2">
                              {entry.subject}
                            </td>
                            <td className="border-b border-gray-100/30 px-3 py-2">
                              {entry.newRoom}
                            </td>
                            <td className="border-b border-gray-100/30 px-3 py-2">
                              {renderTypeCell(entry.type)}
                            </td>
                            <td className="border-b border-gray-100/30 px-3 py-2 italic">
                              {entry.comment || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm italic text-gray-600">
                    Keine Vertretungen für diesen Jahrgang.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
};

export default SubstitutionPlanDisplay;
