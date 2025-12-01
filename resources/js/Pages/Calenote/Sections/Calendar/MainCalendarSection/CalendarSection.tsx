interface CalendarSectionProps {
    date: Date;
    active?: boolean; // active 추가, optional
    isNextOfActive?: boolean;
}

export default function CalendarSection({ date, active, isNextOfActive }: CalendarSectionProps) {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const day: number = new Date().getDay();

    return (
        <div className={`grid grid-cols-7 text-right text-sm ${active ? 'border-2 border-blue-500 rounded' : ''}`}>
            {(() => {
                const cells = [];

                const firstDayIndex = new Date(year, month, 1).getDay();
                const lastDay = new Date(year, month + 1, 0).getDate();
                const prevLastDay = new Date(year, month, 0).getDate();

                const totalDays = firstDayIndex + lastDay;
                const totalCells = totalDays <= 35 ? 35 : 42;

                let dayCounter = 0;

                // 이전 달
                for (let i = firstDayIndex; i > 0; i--) {
                    const weekIndex = dayCounter % 7;
                    const isWeekend = weekIndex === 0 || weekIndex === 6;

                    cells.push(
                        <div
                            key={`prev-${i}`}
                            className={`day-box text-gray-400 ${isWeekend ? 'bg-[#0d1117]' : ''}`}
                        >
                            {prevLastDay - i + 1}
                        </div>
                    );

                    dayCounter++;
                }

                // 이번 달
                for (let i = 1; i <= lastDay; i++) {
                    const weekIndex = dayCounter % 7;
                    const isWeekend = weekIndex === 0 || weekIndex === 6;

                    cells.push(
                        <div
                            key={`cur-${i}`}
                            className={`day-box ${isWeekend ? 'bg-[#0d1117] text-white' : 'normal-text'}`}
                        >
                            {i}
                        </div>
                    );

                    dayCounter++;
                }

                // 다음 달
                const nextCount = totalCells - cells.length;
                for (let i = 1; i <= nextCount; i++) {
                    const weekIndex = dayCounter % 7;
                    const isWeekend = weekIndex === 0 || weekIndex === 6;

                    cells.push(
                        <div
                            key={`next-${i}`}
                            className={`day-box text-gray-400 ${isWeekend ? 'bg-[#0d1117]' : ''}`}
                        >
                            {i}
                        </div>
                    );

                    dayCounter++;
                }

                return cells;
            })()}
        </div>
    );
}
