export default function Loading({ Toggle }) {
    return (
        <div className={`fixed inset-0 bg-black/30 z-[999] justify-center items-center ${Toggle ? "flex" : "hidden"}`}>
            <div className="flex items-center gap-3">
                <img src="/asset/images/Logo/icon.png" className="w-20 animate-pulse" alt="" />
                <p className="font-semibold text-2xl text-white flex gap-[2px]">
                    {"Loading...".split("").map((char, i) => (
                        <span
                            key={i}
                            className="animate-fadeUp"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            {char}
                        </span>
                    ))}
                </p>
            </div>
        </div>
    );
}
