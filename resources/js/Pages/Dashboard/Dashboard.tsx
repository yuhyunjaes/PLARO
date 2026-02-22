import { Head } from "@inertiajs/react";
import axios from "axios";
import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useState } from "react";

interface DashboardOverviewResponse {
    success: boolean;
    summary: {
        events_total: number;
        challenges_total: number;
        ddays_total: number;
        notepads_total: number;
        active_challenges: number;
        active_ddays: number;
    };
    monthly_series: {
        labels: string[];
        events: number[];
        challenges: number[];
        ddays: number[];
        notepads: number[];
    };
    notepad_category_latest10: Array<{ name: string; value: number; latest_at: string }>;
    active_challenge_progress: Array<{
        uuid: string;
        title: string;
        current_day: number;
        event_uuid: string | null;
        today_total: number;
        today_done: number;
        today_required_total: number;
        today_required_done: number;
        today_mission_completed: boolean;
        today_pending_tasks: Array<{
            id: number;
            title: string;
            is_required: boolean;
        }>;
    }>;
    active_dday_progress: Array<{
        uuid: string;
        title: string;
        current_day: number;
        event_uuid: string | null;
        today_checked: boolean;
    }>;
    challenge_template_top10: Array<{
        uuid: string;
        title: string;
        usage_count: number;
        like_count: number;
        owner_name: string | null;
        is_system: boolean;
    }>;
    markdown_template_top10: Array<{
        uuid: string;
        title: string;
        usage_count: number;
        like_count: number;
        owner_name: string | null;
    }>;
    my_challenge_template_top10: Array<{
        uuid: string;
        title: string;
        usage_count: number;
        like_count: number;
        owner_name: string | null;
        is_system: boolean;
    }>;
    my_markdown_template_top10: Array<{
        uuid: string;
        title: string;
        usage_count: number;
        like_count: number;
        owner_name: string | null;
    }>;
}

type TemplateRankItem = {
    uuid: string;
    title: string;
    usage_count: number;
    like_count: number;
    owner_name: string | null;
};

const emptyData: DashboardOverviewResponse = {
    success: true,
    summary: {
        events_total: 0,
        challenges_total: 0,
        ddays_total: 0,
        notepads_total: 0,
        active_challenges: 0,
        active_ddays: 0,
    },
    monthly_series: {
        labels: [],
        events: [],
        challenges: [],
        ddays: [],
        notepads: [],
    },
    notepad_category_latest10: [],
    active_challenge_progress: [],
    active_dday_progress: [],
    challenge_template_top10: [],
    markdown_template_top10: [],
    my_challenge_template_top10: [],
    my_markdown_template_top10: [],
};

const maskName = (name: string | null) => {
    if (!name) return "알수없음";
    if (name === "시스템") return name;

    const chars = Array.from(name);
    if (chars.length <= 1) return `${chars[0] ?? "*"}*`;
    if (chars.length === 2) return `${chars[0]}*`;
    return `${chars[0]}*${chars[chars.length - 1]}`;
};

const progressTierMeta = (day: number) => {
    if (day >= 100) {
        return {
            label: "레전드",
            badgeClass: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-400/40",
            barClass: "bg-violet-500",
        };
    }
    if (day >= 30) {
        return {
            label: "집중",
            badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/40",
            barClass: "bg-emerald-500",
        };
    }
    if (day >= 14) {
        return {
            label: "가속",
            badgeClass: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/40",
            barClass: "bg-blue-500",
        };
    }
    return {
        label: "새싹",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/40",
        barClass: "bg-amber-500",
    };
};

const fireLevelMeta = (day: number): { emoji: string; className: string } | null => {
    if (day >= 50) {
        return {
            emoji: "🔥🔥🔥",
            className: "border-red-400 dark:border-red-700 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 animate-pulse",
        };
    }
    if (day >= 21) {
        return {
            emoji: "🔥🔥",
            className: "border-orange-400 dark:border-orange-700 bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
        };
    }
    if (day >= 7) {
        return {
            emoji: "🔥",
            className: "border-amber-400 dark:border-amber-700 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
        };
    }
    return null;
};

function TemplateTopRankList({
    title,
    description,
    items,
}: {
    title: string;
    description?: string;
    items: TemplateRankItem[];
}) {
    const maxUsage = Math.max(1, ...items.map((item) => item.usage_count));
    const topRankMeta = (rank: number) => {
        if (rank === 1) {
            return {
                rankClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400/20 dark:text-amber-200 dark:border-amber-400/40",
                rowClass: "border-amber-300/80 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/30 dark:to-gray-950",
                tagClass: "bg-amber-500 text-white",
            };
        }
        if (rank === 2) {
            return {
                rankClass: "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-400/20 dark:text-slate-200 dark:border-slate-300/40",
                rowClass: "border-slate-300/80 dark:border-slate-600/50 bg-gradient-to-r from-slate-100 to-white dark:from-slate-900/60 dark:to-gray-950",
                tagClass: "bg-slate-500 text-white",
            };
        }
        if (rank === 3) {
            return {
                rankClass: "bg-orange-200 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-400/40",
                rowClass: "border-orange-300/80 dark:border-orange-600/50 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/25 dark:to-gray-950",
                tagClass: "bg-orange-500 text-white",
            };
        }
        return {
            rankClass: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
            rowClass: "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950",
            tagClass: "bg-gray-500 text-white",
        };
    };

    return (
        <div className="card p-3 md:p-4">
            <p className="normal-text font-semibold text-sm md:text-base">{title}</p>
            {description ? (
                <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">{description}</p>
            ) : (
                <div className="mb-3" />
            )}
            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="rounded border border-dashed border-gray-300 dark:border-gray-700 p-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        데이터가 없습니다.
                    </div>
                ) : (
                    items.map((item, idx) => {
                        const rank = idx + 1;
                        const meta = topRankMeta(rank);
                        const usageRatio = Math.max(8, Math.round((item.usage_count / maxUsage) * 100));
                        return (
                            <div key={item.uuid} className={`rounded border px-2.5 md:px-3 py-2 ${meta.rowClass}`}>
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full border flex items-center justify-center text-xs md:text-sm font-bold ${meta.rankClass}`}>
                                        {rank}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="normal-text text-xs md:text-sm font-semibold truncate">{item.title}</p>
                                            {rank <= 3 ? (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${meta.tagClass}`}>
                                                    TOP {rank}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                            작성자 {maskName(item.owner_name)}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="normal-text text-xs md:text-sm font-semibold">{item.usage_count}회</p>
                                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">좋아요 {item.like_count}</p>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded ${rank <= 3 ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-500"}`}
                                            style={{ width: `${usageRatio}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function ActiveProgressList({
    title,
    items,
    emptyText,
    type,
}: {
    title: string;
    items: Array<{
        uuid: string;
        title: string;
        current_day: number;
        event_uuid?: string | null;
        today_total?: number;
        today_done?: number;
        today_required_total?: number;
        today_required_done?: number;
        today_mission_completed?: boolean;
        today_pending_tasks?: Array<{
            id: number;
            title: string;
            is_required: boolean;
        }>;
        today_checked?: boolean;
    }>;
    emptyText: string;
    type: "challenge" | "dday";
}) {
    return (
        <div className="card p-3 md:p-4">
            <p className="normal-text font-semibold text-sm md:text-base mb-3">{title}</p>
            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="rounded border border-dashed border-gray-300 dark:border-gray-700 p-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {emptyText}
                    </div>
                ) : (
                    items.map((item, idx) => {
                        const day = Math.max(1, item.current_day);
                        const tier = progressTierMeta(day);
                        const fireLevel = fireLevelMeta(day);
                        const missionCompleted = Boolean(item.today_mission_completed);
                        const pendingTasks = item.today_pending_tasks ?? [];
                        const canGoMission = type === "challenge"
                            && (item.today_required_total ?? 0) > 0
                            && !missionCompleted
                            && !!item.event_uuid;
                        const canGoDday = type === "dday" && !item.today_checked && !!item.event_uuid;
                        return (
                            <div key={item.uuid} className="rounded border border-gray-200 dark:border-gray-800 px-2.5 md:px-3 py-2">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs md:text-sm font-bold normal-text">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="normal-text text-xs md:text-sm font-semibold truncate">{item.title}</p>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${tier.badgeClass}`}>
                                                {tier.label}
                                            </span>
                                            {fireLevel ? (
                                                <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${fireLevel.className}`}>
                                                    {fireLevel.emoji}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="normal-text text-xs md:text-sm font-bold">{day}일째</p>
                                        {type === "challenge" ? (
                                            <p className={`text-[10px] md:text-xs mt-0.5 ${missionCompleted ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                                                {missionCompleted
                                                    ? "오늘 미션 완료"
                                                    : `오늘 미션 ${item.today_required_done ?? 0}/${item.today_required_total ?? 0}`}
                                            </p>
                                        ) : (
                                            <p className={`text-[10px] md:text-xs mt-0.5 ${item.today_checked ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                                                {item.today_checked ? "오늘 체크 완료" : "오늘 체크 미완료"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded ${tier.barClass}`}
                                            style={{ width: `${Math.min(100, Math.max(6, day))}%` }}
                                        />
                                    </div>
                                </div>
                                {type === "challenge" && pendingTasks.length > 0 ? (
                                    <details className="mt-2 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 px-2.5 py-2">
                                        <summary className="cursor-pointer list-none text-[11px] md:text-xs font-semibold normal-text flex items-center justify-between">
                                            <span>오늘 안한 미션 보기</span>
                                            <span className="text-rose-600 dark:text-rose-300">{pendingTasks.length}개</span>
                                        </summary>
                                        <div className="mt-2 space-y-1.5">
                                            {pendingTasks.map((task) => (
                                                <div key={task.id} className="flex items-center gap-2 text-[11px] md:text-xs">
                                                    <span className={`px-1.5 py-0.5 rounded border ${task.is_required ? "border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300" : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>
                                                        {task.is_required ? "필수" : "선택"}
                                                    </span>
                                                    <span className="normal-text truncate">{task.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ) : null}
                                {canGoMission ? (
                                    <div className="mt-2 flex justify-end">
                                        <a
                                            href={`/calendar/c/${item.event_uuid}`}
                                            className="inline-flex items-center px-2.5 py-1 rounded border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                                        >
                                            아직 안함 · 하러가기
                                        </a>
                                    </div>
                                ) : null}
                                {canGoDday ? (
                                    <div className="mt-2 flex justify-end">
                                        <a
                                            href={`/calendar/d/${item.event_uuid}`}
                                            className="inline-flex items-center px-2.5 py-1 rounded border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                                        >
                                            오늘 체크 하러가기
                                        </a>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [data, setData] = useState<DashboardOverviewResponse>(emptyData);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await axios.get<DashboardOverviewResponse>("/api/dashboard/overview");
                if (!mounted) return;
                if (!res.data?.success) {
                    setError("대시보드 데이터를 불러오지 못했습니다.");
                    return;
                }
                setData(res.data);
            } catch {
                if (!mounted) return;
                setError("대시보드 데이터를 불러오지 못했습니다.");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, []);

    const axisColor = "#9ca3af";

    const monthlyOption = useMemo(() => ({
        tooltip: { trigger: "axis" },
        legend: { top: 0 },
        grid: { left: 30, right: 20, top: 40, bottom: 28, containLabel: true },
        xAxis: {
            type: "category",
            data: data.monthly_series.labels,
            axisLabel: { color: axisColor },
        },
        yAxis: {
            type: "value",
            axisLabel: { color: axisColor },
            splitLine: { lineStyle: { color: "#e5e7eb" } },
        },
        series: [
            { name: "이벤트", type: "line", smooth: true, data: data.monthly_series.events },
            { name: "챌린지", type: "line", smooth: true, data: data.monthly_series.challenges },
            { name: "디데이", type: "line", smooth: true, data: data.monthly_series.ddays },
            { name: "메모장", type: "line", smooth: true, data: data.monthly_series.notepads },
        ],
    }), [data.monthly_series]);

    const notepadCategoryLatestOption = useMemo(() => ({
        tooltip: {
            trigger: "axis",
            formatter: (params: any) => {
                const row = Array.isArray(params) ? params[0] : params;
                const raw = data.notepad_category_latest10[row?.dataIndex ?? 0];
                const latestText = raw?.latest_at ? String(raw.latest_at).slice(0, 16).replace("T", " ") : "-";
                return `${row?.name ?? ""}<br/>메모 수: ${row?.value ?? 0}<br/>최신 수정: ${latestText}`;
            },
        },
        grid: { left: 24, right: 16, top: 24, bottom: 10, containLabel: true },
        xAxis: {
            type: "value",
            axisLabel: { color: axisColor },
            splitLine: { lineStyle: { color: "#e5e7eb" } },
        },
        yAxis: {
            type: "category",
            axisLabel: { color: axisColor, width: 110, overflow: "truncate" },
            data: data.notepad_category_latest10.map((item) => item.name).reverse(),
        },
        series: [
            {
                name: "메모 수",
                type: "bar",
                data: data.notepad_category_latest10.map((item) => item.value).reverse(),
                itemStyle: { color: "#0ea5e9", borderRadius: [0, 6, 6, 0] },
            },
        ],
    }), [axisColor, data.notepad_category_latest10]);

    const summaryCards = [
        { label: "이벤트", value: data.summary.events_total },
        { label: "챌린지", value: data.summary.challenges_total },
        { label: "디데이", value: data.summary.ddays_total },
        { label: "메모장", value: data.summary.notepads_total },
        { label: "활성 챌린지", value: data.summary.active_challenges },
        { label: "활성 디데이", value: data.summary.active_ddays },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="w-full min-h-full p-4 md:p-5 bg-gray-100 dark:bg-gray-950 overflow-y-auto">
                <div className="mb-4">
                    <h1 className="normal-text text-lg md:text-xl font-bold">내 활동 대시보드</h1>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">이벤트, 챌린지, 디데이, 메모장 데이터와 템플릿 사용 순위를 확인하세요.</p>
                </div>

                {error ? (
                    <div className="card p-4 text-sm text-red-500">{error}</div>
                ) : null}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                    {summaryCards.map((card) => (
                        <div key={card.label} className="card p-3">
                            <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                            <p className="normal-text text-xl md:text-2xl font-extrabold mt-1">{loading ? "-" : card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="card p-3 md:p-4">
                        <p className="normal-text font-semibold text-sm md:text-base mb-2">월별 활동 추이</p>
                        <ReactECharts option={monthlyOption} style={{ height: 300 }} />
                    </div>

                    <div className="card p-3 md:p-4">
                        <p className="normal-text font-semibold text-sm md:text-base mb-2">메모장 카테고리 최신순 10개</p>
                        <ReactECharts option={notepadCategoryLatestOption} style={{ height: 300 }} />
                    </div>

                    <ActiveProgressList
                        title="진행 중 챌린지 도전 일수"
                        items={data.active_challenge_progress}
                        emptyText="현재 진행 중인 챌린지가 없습니다."
                        type="challenge"
                    />

                    <ActiveProgressList
                        title="진행 중 디데이 일수"
                        items={data.active_dday_progress}
                        emptyText="현재 진행 중인 디데이가 없습니다."
                        type="dday"
                    />

                    <TemplateTopRankList
                        title="챌린지 템플릿 랭킹 TOP 10"
                        description="공개 템플릿 기준 사용 순위"
                        items={data.challenge_template_top10}
                    />

                    <TemplateTopRankList
                        title="마크다운 템플릿 랭킹 TOP 10"
                        description="공개 템플릿 기준 사용 순위"
                        items={data.markdown_template_top10}
                    />

                    <TemplateTopRankList
                        title="내 챌린지 템플릿 사용 순위 TOP 10"
                        description="내가 만든 챌린지 템플릿 사용 순위"
                        items={data.my_challenge_template_top10}
                    />

                    <TemplateTopRankList
                        title="내 마크다운 템플릿 사용 순위 TOP 10"
                        description="내가 만든 마크다운 템플릿 사용 순위"
                        items={data.my_markdown_template_top10}
                    />
                </div>
            </div>
        </>
    );
}
