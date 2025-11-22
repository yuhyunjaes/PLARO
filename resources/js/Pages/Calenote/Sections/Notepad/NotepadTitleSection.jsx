// 메모장 페이지 메인 타이틀 영역

export default function NotepadTitleSection() {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const day = dayNames[today.getDay()];

    return (
        <div className="py-5 pl-5 space-y-5">
            <h1 className="normal-text font-semibold text-2xl md:text-4xl">
                오늘의 기록을 남겨보세요
            </h1>
            <p className="mt-1 normal-text font-semibold text-sm md:text-base text-gray-600 dark:text-gray-400">
                {year}년 {month}월 {date}일 {day}요일
            </p>
        </div>
    );
}
