export default function Loading() {
    return (
        <div className="fixed top-0 left-0 size-full bg-black/30 z-[999] flex items-center justify-center">
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
