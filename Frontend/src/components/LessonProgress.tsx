import { useEffect, useMemo, useState } from "react";
import { BookOpen, Coffee } from "lucide-react";

type BlockType = "lesson" | "break";

interface ScheduleBlock {
  id: string;
  label: string;
  start: string;
  end: string;
  type: BlockType;
}

interface TimedBlock extends ScheduleBlock {
  startTime: Date;
  endTime: Date;
}

const schedule: ScheduleBlock[] = [
  {
    id: "lesson-1",
    label: "1. Stunde",
    start: "08:00",
    end: "08:45",
    type: "lesson",
  },
  {
    id: "break-1",
    label: "1. Kurzpause",
    start: "08:45",
    end: "08:50",
    type: "break",
  },
  {
    id: "lesson-2",
    label: "2. Stunde",
    start: "08:50",
    end: "09:35",
    type: "lesson",
  },
  {
    id: "break-2",
    label: "2. Pause",
    start: "09:35",
    end: "09:45",
    type: "break",
  },
  {
    id: "lesson-3",
    label: "3. Stunde",
    start: "09:45",
    end: "10:30",
    type: "lesson",
  },
  {
    id: "lesson-4",
    label: "4. Stunde",
    start: "10:30",
    end: "11:15",
    type: "lesson",
  },
  {
    id: "break-3",
    label: "3. Pause",
    start: "11:15",
    end: "11:30",
    type: "break",
  },
  {
    id: "lesson-5",
    label: "5. Stunde",
    start: "11:30",
    end: "12:15",
    type: "lesson",
  },
  {
    id: "break-4",
    label: "Hofpause",
    start: "12:15",
    end: "12:50",
    type: "break",
  },
  {
    id: "lesson-6",
    label: "6. Stunde",
    start: "12:50",
    end: "13:35",
    type: "lesson",
  },
  {
    id: "lesson-7",
    label: "7. Stunde",
    start: "13:45",
    end: "14:30",
    type: "lesson",
  },
  {
    id: "break-5",
    label: "5. Pause",
    start: "14:30",
    end: "14:40",
    type: "break",
  },
  {
    id: "lesson-8",
    label: "8. Stunde",
    start: "14:40",
    end: "15:25",
    type: "lesson",
  },
  {
    id: "lesson-9",
    label: "9. Stunde",
    start: "15:25",
    end: "16:10",
    type: "lesson",
  },
  {
    id: "break-6",
    label: "6. Pause",
    start: "16:10",
    end: "16:15",
    type: "break",
  },
  {
    id: "lesson-10",
    label: "10. Stunde",
    start: "16:15",
    end: "17:00",
    type: "lesson",
  },
  {
    id: "lesson-11",
    label: "11. Stunde",
    start: "17:00",
    end: "17:45",
    type: "lesson",
  },
];

const createTimedSchedule = (date: Date): TimedBlock[] =>
  schedule.map((block) => {
    const [startHours, startMinutes] = block.start.split(":").map(Number);
    const [endHours, endMinutes] = block.end.split(":").map(Number);
    const startTime = new Date(date);
    startTime.setHours(startHours, startMinutes, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(endHours, endMinutes, 0, 0);
    return { ...block, startTime, endTime };
  });

const formatClock = (time: Date) =>
  time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

const formatDuration = (ms: number) => {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${totalMinutes} Min.`;
  if (minutes === 0) return `${hours} Std.`;
  return `${hours} Std. ${minutes} Min.`;
};

const LessonProgress = () => {
  const [now, setNow] = useState(new Date());
  const dayKey = now.toDateString();
  const timedSchedule = useMemo(
    () => createTimedSchedule(new Date(dayKey)),
    [dayKey],
  );

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentIndex = timedSchedule.findIndex(
    (block) => now >= block.startTime && now < block.endTime,
  );
  const currentBlock = currentIndex >= 0 ? timedSchedule[currentIndex] : null;
  const previousBlock =
    currentIndex > 0
      ? timedSchedule[currentIndex - 1]
      : (timedSchedule.filter((block) => block.endTime <= now).slice(-1)[0] ??
        null);
  const nextBlock =
    currentIndex >= 0
      ? timedSchedule[currentIndex + 1]
      : (timedSchedule.find((block) => block.startTime > now) ?? null);

  const dayStart = timedSchedule[0].startTime;
  const dayEnd = timedSchedule[timedSchedule.length - 1].endTime;

  const isBeforeDay = now < dayStart;
  const isAfterDay = now >= dayEnd;
  const isGap =
    !currentBlock && !isBeforeDay && !isAfterDay && previousBlock && nextBlock;

  const activeLabel =
    currentBlock?.label ?? (isGap ? "Wechselzeit" : "Schulzeit");
  const activeType: BlockType = currentBlock?.type ?? "break";
  const activeStart =
    isGap && previousBlock ? previousBlock.endTime : currentBlock?.startTime;
  const activeEnd =
    isGap && nextBlock ? nextBlock.startTime : currentBlock?.endTime;

  const progressPercent =
    activeStart && activeEnd
      ? Math.min(
          100,
          Math.max(
            0,
            ((now.getTime() - activeStart.getTime()) /
              (activeEnd.getTime() - activeStart.getTime())) *
              100,
          ),
        )
      : 0;

  const remainingMs = activeEnd ? activeEnd.getTime() - now.getTime() : 0;

  const statusStyles =
    activeType === "lesson"
      ? "bg-blue-50 border-blue-200"
      : "bg-amber-50 border-amber-200";
  const progressStyles =
    activeType === "lesson" ? "bg-blue-500" : "bg-amber-500";
  const textStyles =
    activeType === "lesson" ? "text-blue-800" : "text-amber-900";

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-4 w-full">
      <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-3 mb-5">
        Unterrichtsfortschritt
      </h2>

      <div
        className={`rounded-xl border-2 ${statusStyles} relative overflow-hidden`}
      >
        <div
          className={`absolute inset-0 ${progressStyles} opacity-20 transition-all duration-300 ease-out`}
          style={{ width: `${progressPercent}%` }}
        />

        <div className="relative z-10 p-4">
          <div className="flex items-center gap-4 mb-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-md transition-all ${
                activeType === "lesson" ? "bg-blue-600" : "bg-amber-500"
              }`}
            >
              {activeType === "lesson" ? (
                <BookOpen className="h-6 w-6 text-white" />
              ) : (
                <Coffee className="h-6 w-6 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {currentBlock || isGap ? (
                <h3 className={`text-lg font-bold ${textStyles} truncate`}>
                  {activeLabel}
                </h3>
              ) : (
                <h3 className={`text-lg font-bold ${textStyles}`}>
                  {isBeforeDay ? "Schultag startet gleich" : "Schultag beendet"}
                </h3>
              )}

              <div className="flex items-center gap-2 mt-1">
                {currentBlock || isGap ? (
                  <>
                    <span className="text-sm font-medium text-gray-700">
                      Noch {formatDuration(remainingMs)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {progressPercent.toFixed(0)}% abgeschlossen
                    </span>
                  </>
                ) : isBeforeDay && nextBlock ? (
                  <span className="text-sm font-medium text-gray-700">
                    Start um {formatClock(nextBlock.startTime)} · Noch{" "}
                    {formatDuration(
                      nextBlock.startTime.getTime() - now.getTime(),
                    )}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    Ende um {formatClock(dayEnd)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonProgress;
