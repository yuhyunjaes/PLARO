// 메모장 카테고리 수치 영역

import { useCallback, useEffect, useState, useMemo } from "react";
import * as echarts from "echarts";

export default function NoteInsightSection() {
    const [categories, setCategories] = useState([]);

    const getCategories = useCallback(async () => {
        try {
            const res = await axios.get("/api/notepads/categories");
            if (res.data.success) setCategories(res.data.categories);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    useEffect(() => {
        if (categories.length === 0) return;

        const chartDom = document.getElementById("chart-category");
        const chart = echarts.init(chartDom);

        const option = {
            tooltip: {
                trigger: "item",
                formatter: "{b}: {c}건 ({d}%)",
            },
            legend: {
                orient: "vertical",
                left: "left",
                textStyle: {
                    color: "var(--tw-prose-body)",
                },
            },
            series: [
                {
                    name: "카테고리",
                    type: "pie",
                    radius: ["40%", "70%"],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: "transparent",
                        borderWidth: 2,
                    },
                    label: {
                        show: false,
                        position: "center",
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: "bold",
                        },
                    },
                    labelLine: { show: false },
                    data: categories.map((item) => ({
                        value: item.count,
                        name: item.category,
                    })),
                },
            ],
        };

        chart.setOption(option);

        const handleResize = () => chart.resize();
        window.addEventListener("resize", handleResize);
        const observer = new ResizeObserver(() => chart.resize());
        observer.observe(chartDom);
        const handleVisibility = () => {
            if (!document.hidden) chart.resize();
        };
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("visibilitychange", handleVisibility);
            observer.disconnect();
            chart.dispose();
        };
    }, [categories]);

    const topCategories = useMemo(() => {
        if (categories.length === 0) return [];
        const maxCount = Math.max(...categories.map((c) => c.count));
        return categories.filter((c) => c.count === maxCount);
    }, [categories]);

    const bottomText = useMemo(() => {
        if (categories.length === 0) return "아직 메모장이 없습니다.";
        if (topCategories.length === 1) {
            return `가장 많이 작성한 카테고리는 '${topCategories[0].category}' 입니다.`;
        } else {
            const names = topCategories.map((c) => `'${c.category}'`).join(", ");
            return `가장 많이 작성한 카테고리는 ${names} 입니다.`;
        }
    }, [categories, topCategories]);

    return (
        <div className="card border row-span-2 border-gray-300 dark:border-gray-800 col-span-2 lg:col-span-2 p-3 flex flex-col">
            <h3 className="text-sm normal-text font-semibold mb-3">
                메모장 카테고리 비율
            </h3>

            <div
                id="chart-category"
                className="relative flex-3 w-full h-full min-h-[200px]"
            ></div>

            <div className="flex-1 mt-3 flex justify-center items-center text-sm text-gray-600 dark:text-gray-400">
                {bottomText}
            </div>
        </div>
    );
}
