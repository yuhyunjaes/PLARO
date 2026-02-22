import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";

export interface ChallengeTemplateCreatePayload {
    title: string;
    description: string | null;
    icon: string | null;
    category: "routine" | "study" | "workout" | "custom";
    duration_days: number;
    visibility: "private" | "public" | "unlisted";
    days: {
        day_number: number;
        tasks: {
            title: string;
            description: string | null;
            is_required: boolean;
        }[];
    }[];
}

export interface ChallengeTemplateEditFormData extends ChallengeTemplateCreatePayload {
    uuid: string;
}

interface ChallengeTemplateCreateModalProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    creating: boolean;
    onCreate: (payload: ChallengeTemplateCreatePayload) => Promise<void>;
    onUpdate: (templateUuid: string, payload: ChallengeTemplateCreatePayload) => Promise<void>;
    editingTemplate: ChallengeTemplateEditFormData | null;
}

interface DayTaskForm {
    title: string;
    description: string;
    is_required: boolean;
}

interface DayForm {
    day_number: number;
    tasks: DayTaskForm[];
}

export default function ChallengeTemplateCreateModal({ open, setOpen, creating, onCreate, onUpdate, editingTemplate }: ChallengeTemplateCreateModalProps) {
    const DEFAULT_ICON = "✨";
    const DEFAULT_CATEGORY: "routine" | "study" | "workout" | "custom" = "custom";
    const DEFAULT_DURATION_DAYS = 7;
    const DEFAULT_VISIBILITY: "private" | "public" | "unlisted" = "private";

    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [icon, setIcon] = useState<string>(DEFAULT_ICON);
    const [category, setCategory] = useState<"routine" | "study" | "workout" | "custom">(DEFAULT_CATEGORY);
    const [durationDays, setDurationDays] = useState<number>(DEFAULT_DURATION_DAYS);
    const [visibility, setVisibility] = useState<"private" | "public" | "unlisted">(DEFAULT_VISIBILITY);
    const [days, setDays] = useState<DayForm[]>([]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setIcon(DEFAULT_ICON);
        setCategory(DEFAULT_CATEGORY);
        setDurationDays(DEFAULT_DURATION_DAYS);
        setVisibility(DEFAULT_VISIBILITY);
        setDays(Array.from({ length: DEFAULT_DURATION_DAYS }, (_, idx) => ({
            day_number: idx + 1,
            tasks: [{ title: "", description: "", is_required: true }],
        })));
    };

    const fillEditForm = (editData: ChallengeTemplateEditFormData) => {
        setTitle(editData.title);
        setDescription(editData.description ?? "");
        setIcon(editData.icon ?? DEFAULT_ICON);
        setCategory(editData.category);
        setDurationDays(editData.duration_days);
        setVisibility(editData.visibility);
        setDays(
            [...editData.days]
                .sort((a, b) => a.day_number - b.day_number)
                .map((day) => ({
                    day_number: day.day_number,
                    tasks: day.tasks.length > 0
                        ? day.tasks.map((task) => ({
                            title: task.title ?? "",
                            description: task.description ?? "",
                            is_required: Boolean(task.is_required),
                        }))
                        : [{ title: "", description: "", is_required: true }],
                }))
        );
    };

    useEffect(() => {
        if (open) {
            if (editingTemplate) {
                fillEditForm(editingTemplate);
            } else {
                resetForm();
            }
        }
    }, [open, editingTemplate]);

    useEffect(() => {
        if (!open) return;
        if (editingTemplate) return;

        setDays((prev) => {
            const next = Array.from({ length: durationDays }, (_, idx) => {
                const found = prev.find((d) => d.day_number === idx + 1);
                return found ?? {
                    day_number: idx + 1,
                    tasks: [{ title: "", description: "", is_required: true }],
                };
            });

            return next;
        });
    }, [durationDays, open, editingTemplate]);

    const canSubmit = useMemo(() => {
        if (!title.trim()) return false;
        if (days.length === 0) return false;

        for (const day of days) {
            if (day.tasks.length === 0) return false;
            for (const task of day.tasks) {
                if (!task.title.trim()) return false;
            }
        }
        return true;
    }, [title, days]);

    const setTaskField = (dayNumber: number, taskIndex: number, key: keyof DayTaskForm, value: string | boolean) => {
        setDays((prev) => prev.map((day) => {
            if (day.day_number !== dayNumber) return day;
            return {
                ...day,
                tasks: day.tasks.map((task, idx) => idx === taskIndex ? { ...task, [key]: value } : task),
            };
        }));
    };

    const addTask = (dayNumber: number) => {
        setDays((prev) => prev.map((day) => {
            if (day.day_number !== dayNumber) return day;
            return {
                ...day,
                tasks: [...day.tasks, { title: "", description: "", is_required: true }],
            };
        }));
    };

    const removeTask = (dayNumber: number, taskIndex: number) => {
        setDays((prev) => prev.map((day) => {
            if (day.day_number !== dayNumber) return day;
            if (day.tasks.length === 1) return day;

            return {
                ...day,
                tasks: day.tasks.filter((_, idx) => idx !== taskIndex),
            };
        }));
    };

    const submit = async () => {
        if (!canSubmit || creating) return;

        const payload: ChallengeTemplateCreatePayload = {
            title: title.trim(),
            description: description.trim() ? description.trim() : null,
            icon: icon.trim() ? icon.trim() : null,
            category,
            duration_days: durationDays,
            visibility,
            days: days.map((day) => ({
                day_number: day.day_number,
                tasks: day.tasks.map((task) => ({
                    title: task.title.trim(),
                    description: task.description.trim() ? task.description.trim() : null,
                    is_required: task.is_required,
                })),
            })),
        };

        if (editingTemplate) {
            await onUpdate(editingTemplate.uuid, payload);
            return;
        }

        await onCreate(payload);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center px-3 sm:px-5 py-4" onClick={() => !creating && setOpen(false)}>
            <div className="w-full max-w-[720px] max-h-[92vh] rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 sm:p-5 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h2 className="normal-text text-lg font-semibold">{editingTemplate ? "템플릿 수정" : "템플릿 만들기"}</h2>

                <div className="mt-4 space-y-4 flex-1 overflow-y-auto hidden-scroll pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="form-label">제목</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="form-control"
                                placeholder="예: 아침 루틴 정착 7일"
                            />
                        </div>
                        <div>
                            <label className="form-label">아이콘</label>
                            <input
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="form-control"
                                placeholder="예: 🌅"
                                maxLength={32}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">설명</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="form-control min-h-[72px]"
                            placeholder="템플릿 설명을 입력하세요"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="form-label">카테고리</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="form-control">
                                <option value="routine">routine</option>
                                <option value="study">study</option>
                                <option value="workout">workout</option>
                                <option value="custom">custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">기간(일)</label>
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={durationDays}
                                onChange={(e) => {
                                    const value = Number(e.target.value || 1);
                                    setDurationDays(Math.min(31, Math.max(1, value)));
                                }}
                                className="form-control"
                            />
                        </div>
                        <div>
                            <label className="form-label">공개 범위</label>
                            <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className="form-control">
                                <option value="private">private</option>
                                <option value="public">public</option>
                                <option value="unlisted">unlisted</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">일차별 할 일</p>
                        {days.map((day) => (
                            <div key={day.day_number} className="rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold normal-text">Day {day.day_number}</p>
                                    <button
                                        type="button"
                                        className="btn border border-blue-500 text-blue-500 bg-white dark:bg-gray-950 px-3 py-1"
                                        onClick={() => addTask(day.day_number)}
                                    >
                                        할 일 추가
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {day.tasks.map((task, idx) => (
                                        <div key={`${day.day_number}-${idx}`} className="rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-2 space-y-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <input
                                                    className="form-control"
                                                    placeholder={`할 일 ${idx + 1} 제목`}
                                                    value={task.title}
                                                    onChange={(e) => setTaskField(day.day_number, idx, "title", e.target.value)}
                                                />
                                                <input
                                                    className="form-control"
                                                    placeholder="설명(선택)"
                                                    value={task.description}
                                                    onChange={(e) => setTaskField(day.day_number, idx, "description", e.target.value)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <label className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.is_required}
                                                        onChange={(e) => setTaskField(day.day_number, idx, "is_required", e.target.checked)}
                                                    />
                                                    필수 할 일
                                                </label>
                                                <button
                                                    type="button"
                                                    className="btn bg-red-500 text-white px-3 py-1"
                                                    onClick={() => removeTask(day.day_number, idx)}
                                                    disabled={day.tasks.length === 1}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-4 flex flex-col-reverse sm:flex-row justify-end gap-2">
                    <button type="button" onClick={() => setOpen(false)} className="btn bg-gray-700 hover:bg-gray-800 text-white w-full sm:w-auto" disabled={creating}>
                        취소
                    </button>
                    <button type="button" onClick={submit} className="btn bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto" disabled={!canSubmit || creating}>
                        {creating ? (editingTemplate ? "수정 중..." : "생성 중...") : (editingTemplate ? "수정 완료" : "템플릿 생성")}
                    </button>
                </div>
            </div>
        </div>
    );
}
