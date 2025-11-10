export default function MainTitleSection({ auth }) {
    const today = new Date();
    const options = { month: "long", day: "numeric", weekday: "long" };
    const formattedDate = today.toLocaleDateString("ko-KR", options);

    return (
        <div className="mb-5 space-y-2">
            <h1 className="text-2xl sm:text-4xl font-semibold normal-text">
                좋은 하루예요, {auth.user.name.slice(1)}!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">
                오늘은 {formattedDate}, 오늘 하루도 기록으로 남겨보세요.
            </p>
        </div>
    );
}
