// 메모장 갯수, 오늘 작성된 메모장 갯수 데이터 read 영역

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
export default function NotepadCountSection() {
    const [notepads, setNotepads] = useState<number>(0);
    const [todayNotepads, setTodayNotepads] = useState<number>(0);
    const [displayNotepads, setDisplayNotepads] = useState<number>(0);
    const [endAnimation, setEndAnimation] = useState<boolean>(false);

    const getNotepads = useCallback(async () => {
        try {
            const res = await axios.get("/api/notepads/count");
            if (res.data.success) {
                setNotepads(res.data.total_count);
                setTodayNotepads(res.data.today_count);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        getNotepads();
    }, [getNotepads]);

    useEffect(() => {
        let start = displayNotepads;
        const end = notepads;
        if (start === end) return;

        const duration = 700; // 애니메이션 시간 (ms)
        const frameRate = 30; // 초당 프레임 수
        const totalFrames = Math.round((duration / 1000) * frameRate);
        const increment = (end - start) / totalFrames;

        let currentFrame = 0;
        const counter = setInterval(() => {
            currentFrame++;
            start += increment;
            setDisplayNotepads(Math.floor(start));
            if (currentFrame >= totalFrames) {
                clearInterval(counter);
                setDisplayNotepads(end);
                setEndAnimation(true);
            }
        }, 1000 / frameRate);

        return () => clearInterval(counter);
    }, [notepads]);

    return (
        <div className="card border border-gray-300 overflow-hidden dark:border-gray-800 p-3 flex flex-col transition-all duration-300">
            <div className="flex-2">
                <div className="size-8 bg-gray-300 dark:bg-gray-600 normal-text flex justify-center items-center rounded">
                    <FontAwesomeIcon icon={faClipboard} />
                </div>
            </div>

            <h3 className="text-sm normal-text font-semibold mb-3 flex-1">
                메모장
            </h3>

            <div className="flex-2 flex justify-between items-center">
                <h1 className="normal-text font-black text-3xl transition-all duration-500">
                    {displayNotepads}
                </h1>

                <div className="relative h-full">
                    {todayNotepads > 0 && (
                        <span className={`
                        px-2 bg-green-500/80 absolute right-0 flex justify-center items-center rounded-xl text-sm text-green-50
                        transition-[bottom] duration-300 delay-300
                        ${endAnimation ? "bottom-0" : "-bottom-10"}
                        `}>
                        <FontAwesomeIcon className="mr-1" icon={faArrowUp} />
                            {endAnimation ? todayNotepads : "0"}
                    </span>
                    )}
                </div>
            </div>
        </div>
    );
}
