import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";

interface ChallengeTemplateItem {
    id: number;
    uuid: string;
    owner_id: number | null;
    owner_name: string | null;
    title: string;
    description: string | null;
    icon: string | null;
    category: "routine" | "study" | "workout" | "custom";
    duration_days: number;
    visibility: "private" | "public" | "unlisted";
    is_system: boolean;
    is_active: boolean;
    liked: boolean;
    usage_count: number;
    like_count: number;
    created_at: string | null;
    updated_at: string | null;
}

interface ChallengeTemplateModalProps {
    activeTemplate: string | null;
    setActiveTemplate: Dispatch<SetStateAction<string | null>>
    contentMode: "normal" | "challenge" | "dday";
    challengeTemplateModal: { status: boolean; templateType: "mine" | "every" | null };
    templates: ChallengeTemplateItem[];
    templatesLoading: boolean;
    templatesError: string;
    searchKeyword: string;
    templatesHasMore: boolean;
    templatesFetchingMore: boolean;
    onSearchKeywordChange: (value: string) => void;
    onLoadMoreTemplates: () => void;
    templateDaysReloadKey: number;
    onClose: () => void;
    onConfirm: () => void;
    onToggleTemplateLike: (template: ChallengeTemplateItem) => void;
    onEditTemplate: (template: ChallengeTemplateItem) => void;
    onDeleteTemplate: (template: ChallengeTemplateItem) => void;
}

interface ChallengeTemplateDayTask {
    id: number;
    task_order: number;
    title: string;
    description: string | null;
    is_required: boolean;
}

interface ChallengeTemplateDayGroup {
    day_number: number;
    tasks: ChallengeTemplateDayTask[];
}

export default function ChallengeTemplateModal({
    activeTemplate,
    setActiveTemplate,
    contentMode,
    challengeTemplateModal,
    templates,
    templatesLoading,
    templatesError,
    searchKeyword,
    templatesHasMore,
    templatesFetchingMore,
    onSearchKeywordChange,
    onLoadMoreTemplates,
    templateDaysReloadKey,
    onClose,
    onConfirm,
    onToggleTemplateLike,
    onEditTemplate,
    onDeleteTemplate,
}: ChallengeTemplateModalProps) {
    const [expandedTemplateUuid, setExpandedTemplateUuid] = useState<string | null>(null);
    const [templateDaysMap, setTemplateDaysMap] = useState<Record<string, ChallengeTemplateDayGroup[]>>({});
    const [templateDaysLoadingMap, setTemplateDaysLoadingMap] = useState<Record<string, boolean>>({});
    const [templateDaysErrorMap, setTemplateDaysErrorMap] = useState<Record<string, string>>({});
    const [templateUpdatedAtMap, setTemplateUpdatedAtMap] = useState<Record<string, string | null>>({});
    const templatesScrollRef = useRef<HTMLDivElement | null>(null);

    const loadTemplateDays = useCallback(async (templateUuid: string) => {
        setTemplateDaysLoadingMap((prev) => ({ ...prev, [templateUuid]: true }));
        setTemplateDaysErrorMap((prev) => ({ ...prev, [templateUuid]: "" }));

        try {
            const res = await axios.get(`/api/challenge-templates/${templateUuid}/days`);

            if (res.data?.success) {
                setTemplateDaysMap((prev) => ({
                    ...prev,
                    [templateUuid]: res.data.days ?? [],
                }));
            } else {
                setTemplateDaysErrorMap((prev) => ({
                    ...prev,
                    [templateUuid]: res.data?.message ?? "일차별 정보를 불러오지 못했습니다.",
                }));
            }
        } catch (e) {
            setTemplateDaysErrorMap((prev) => ({
                ...prev,
                [templateUuid]: "일차별 정보를 불러오지 못했습니다.",
            }));
        } finally {
            setTemplateDaysLoadingMap((prev) => ({ ...prev, [templateUuid]: false }));
        }
    }, []);

    const toggleTemplateDetails = useCallback((templateUuid: string) => {
        if (expandedTemplateUuid === templateUuid) {
            setExpandedTemplateUuid(null);
            return;
        }

        setExpandedTemplateUuid(templateUuid);
        if (!templateDaysMap[templateUuid]) {
            loadTemplateDays(templateUuid);
        }
    }, [expandedTemplateUuid, templateDaysMap, loadTemplateDays]);

    useEffect(() => {
        setTemplateDaysMap({});
        setTemplateDaysLoadingMap({});
        setTemplateDaysErrorMap({});
    }, [templateDaysReloadKey]);

    useEffect(() => {
        setTemplateDaysMap((prev) => {
            const next = { ...prev };
            let changed = false;

            for (const template of templates) {
                const prevUpdatedAt = templateUpdatedAtMap[template.uuid] ?? null;
                const nextUpdatedAt = template.updated_at ?? null;

                if (prevUpdatedAt !== null && prevUpdatedAt !== nextUpdatedAt && next[template.uuid]) {
                    delete next[template.uuid];
                    changed = true;
                }
            }

            return changed ? next : prev;
        });

        const nextMap: Record<string, string | null> = {};
        for (const template of templates) {
            nextMap[template.uuid] = template.updated_at ?? null;
        }
        setTemplateUpdatedAtMap(nextMap);
    }, [templates]);

    useEffect(() => {
        if (!expandedTemplateUuid) return;
        const exists = templates.some((template) => template.uuid === expandedTemplateUuid);
        if (!exists) {
            setExpandedTemplateUuid(null);
        }
    }, [templates, expandedTemplateUuid]);

    useEffect(() => {
        if (!expandedTemplateUuid) return;
        const exists = templates.some((template) => template.uuid === expandedTemplateUuid);
        if (!exists) return;
        if (templateDaysMap[expandedTemplateUuid]) return;
        loadTemplateDays(expandedTemplateUuid);
    }, [expandedTemplateUuid, templateDaysMap, loadTemplateDays, templates]);

    useEffect(() => {
        if (!challengeTemplateModal.status) return;
        if (!activeTemplate) return;
        const exists = templates.some((template) => template.uuid === activeTemplate);
        if (!exists) {
            setActiveTemplate(null);
        }
    }, [challengeTemplateModal.status, templates, activeTemplate, setActiveTemplate]);

    useEffect(() => {
        if (!expandedTemplateUuid) return;
        const exists = templates.some((template) => template.uuid === expandedTemplateUuid);
        if (!exists) {
            setExpandedTemplateUuid(null);
        }
    }, [templates, expandedTemplateUuid]);

    useEffect(() => {
        const container = templatesScrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (templatesLoading || templatesFetchingMore || !templatesHasMore) return;
            const { scrollTop, clientHeight, scrollHeight } = container;
            if (scrollTop + clientHeight >= scrollHeight - 12) {
                onLoadMoreTemplates();
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [templatesLoading, templatesFetchingMore, templatesHasMore, onLoadMoreTemplates]);

    if (!(challengeTemplateModal.status && contentMode === "challenge")) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[999] bg-black/30 flex justify-center items-center px-3 md:px-5 py-4" onClick={() => {setActiveTemplate(null); onClose();}}>
            <div className="w-full max-w-[560px] max-h-[92vh] rounded bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 p-4 md:p-5 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h2 className="normal-text text-lg font-semibold">
                    {challengeTemplateModal.templateType === "every"
                        ? "공개 템플릿 선택"
                        : challengeTemplateModal.templateType === "mine"
                            ? "내 템플릿 선택"
                            : "챌린지 템플릿"}
                </h2>

                <div className="space-y-4 mt-3 flex-1 overflow-y-auto hidden-scroll pr-1">
                    <div className="space-y-2">
                        <p className="text-xs text-gray-600 dark:text-gray-300 block">
                            {challengeTemplateModal.templateType === "every"
                                ? "다른 사용자가 공개한 템플릿 중에서 선택할 수 있어요."
                                : challengeTemplateModal.templateType === "mine"
                                    ? "내가 만든 템플릿 중에서 선택할 수 있어요."
                                    : "원하는 템플릿을 선택해 챌린지를 시작하세요."}
                        </p>

                        <div ref={templatesScrollRef} className="max-h-[38vh] md:max-h-[280px] rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-x-hidden overflow-y-auto grid grid-cols-1 gap-2 px-2 pb-2 pt-0">
                            {templatesLoading ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400 py-5 text-center">템플릿을 불러오는 중입니다...</p>
                            ) : templatesError ? (
                                <p className="text-xs text-red-500 py-5 text-center">{templatesError}</p>
                            ) : templates.length === 0 ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400 py-5 text-center">
                                    {searchKeyword.trim().length > 0 ? "검색 결과가 없습니다." : "표시할 템플릿이 없습니다."}
                                </p>
                            ) : (
                                <>
                                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 pt-2 pb-2 mb-1">
                                        <input
                                            type="text"
                                            value={searchKeyword}
                                            onChange={(e) => onSearchKeywordChange(e.target.value)}
                                            className="form-control text-xs"
                                            placeholder="템플릿 이름 검색"
                                        />
                                    </div>
                                    {templates.map((template) => (
                                    <div
                                        onClick={() => {
                                            if(activeTemplate === template.uuid) {
                                                setActiveTemplate(null);
                                            } else {
                                                setActiveTemplate(template.uuid)
                                            }
                                        }}
                                        key={template.uuid}
                                        className={`w-full rounded border border-gray-300 dark:border-gray-800  ${activeTemplate === template.uuid ? "bg-gray-200 dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 hover:dark:bg-gray-800"} transition-colors text-left p-3`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 min-w-0">
                                                <div className="size-8 rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-center text-sm shrink-0 normal-text">
                                                    {template.icon || "T"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs md:text-sm font-semibold normal-text truncate">{template.title}</p>
                                                    <p className="text-[0.6rem] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                        {template.description || "설명이 없는 템플릿입니다."}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleTemplateDetails(template.uuid);
                                                    }}
                                                    className="h-7 px-2 rounded border border-gray-300 dark:border-gray-700 text-[10px] normal-text bg-white dark:bg-gray-900 hover:bg-gray-100 hover:dark:bg-gray-800 transition-colors"
                                                >
                                                    <span className="hidden md:inline mr-1">{expandedTemplateUuid === template.uuid ? "접기" : "일차별 보기"}</span>
                                                    <FontAwesomeIcon icon={expandedTemplateUuid === template.uuid ? faChevronUp : faChevronDown} />
                                                </button>
                                                {template.is_system ? (
                                                    <span className="text-[10px] px-2 py-1 rounded bg-blue-500 text-white font-semibold">SYSTEM</span>
                                                ) : ""}
                                                {(challengeTemplateModal.templateType === "mine" && !template.is_system) ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                onEditTemplate(template);
                                                            }}
                                                            className="h-7 px-2 rounded border border-gray-300 dark:border-gray-700 text-[10px] normal-text bg-white dark:bg-gray-900 hover:bg-gray-100 hover:dark:bg-gray-800 transition-colors"
                                                        >
                                                            수정
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                onDeleteTemplate(template);
                                                            }}
                                                            className="h-7 px-2 rounded border border-red-400 dark:border-red-800 text-[10px] text-red-500 bg-white dark:bg-gray-900 hover:bg-red-50 hover:dark:bg-red-950/30 transition-colors"
                                                        >
                                                            삭제
                                                        </button>
                                                    </>
                                                ) : ""}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onToggleTemplateLike(template);
                                                    }}
                                                    className={`size-7 cursor-pointer rounded border border-gray-300 dark:border-gray-700 flex items-center justify-center transition-colors ${template.liked ? "text-red-500 bg-red-50 dark:bg-red-950/30" : "text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-100 hover:dark:bg-gray-800"}`}
                                                >
                                                    <FontAwesomeIcon icon={template.liked ? faHeartSolid : faHeartRegular} className="text-xs" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <span className="text-[10px] px-2 py-1 rounded bg-gray-200 dark:bg-gray-900 normal-text">{template.category}</span>
                                            <span className="text-[10px] px-2 py-1 rounded bg-gray-200 dark:bg-gray-900 normal-text">{template.duration_days}일</span>
                                            <span className="text-[10px] px-2 py-1 rounded bg-gray-200 dark:bg-gray-900 normal-text">{template.visibility}</span>
                                            <span className="text-[10px] px-2 py-1 rounded bg-gray-200 dark:bg-gray-900 normal-text">좋아요 {template.like_count}</span>
                                            <span className="text-[10px] px-2 py-1 rounded bg-gray-200 dark:bg-gray-900 normal-text">사용 {template.usage_count}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 truncate">
                                            {template.owner_name ? `제작자: ${template.owner_name}` : (template.is_system ? "시스템 템플릿" : "제작자 정보 없음")}
                                        </p>

                                        {expandedTemplateUuid === template.uuid ? (
                                            <div className="mt-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 space-y-2">
                                                {templateDaysLoadingMap[template.uuid] ? (
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">일차별 할 일을 불러오는 중입니다...</p>
                                                ) : templateDaysErrorMap[template.uuid] ? (
                                                    <p className="text-[11px] text-red-500">{templateDaysErrorMap[template.uuid]}</p>
                                                ) : (templateDaysMap[template.uuid]?.length ?? 0) === 0 ? (
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">등록된 일차별 할 일이 없습니다.</p>
                                                ) : (
                                                    <div className="space-y-2 max-h-[28vh] md:max-h-[180px] overflow-y-auto hidden-scroll">
                                                        {templateDaysMap[template.uuid]?.map((dayGroup) => (
                                                            <div key={`${template.uuid}-day-${dayGroup.day_number}`} className="rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-2">
                                                                <p className="text-[11px] font-semibold normal-text mb-1">Day {dayGroup.day_number}</p>
                                                                <div className="space-y-1">
                                                                    {dayGroup.tasks.map((task) => (
                                                                        <p key={`${template.uuid}-${task.id}`} className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                                                                            {task.task_order}. {task.title} {task.is_required ? "(필수)" : ""}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : ""}
                                    </div>
                                ))}
                                </>
                            )}
                            {templatesFetchingMore ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400 py-2 text-center">더 불러오는 중...</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 ">
                            템플릿을 선택하지 않으면 챌린지를 생성할 수 없습니다.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col-reverse md:flex-row justify-end gap-2 mt-4">
                    <button onClick={() => {setActiveTemplate(null); onClose();}} className="btn text-sm text-white bg-gray-700 hover:bg-gray-800 w-full md:w-auto">취소</button>
                    <button
                        onClick={onConfirm}
                        className={`btn text-sm text-white ${activeTemplate ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-950"} w-full md:w-auto`}
                    >
                        선택 완료
                    </button>
                </div>
            </div>
        </div>
    );
}
