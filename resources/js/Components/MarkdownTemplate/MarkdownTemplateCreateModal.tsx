import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MarkdownTemplateCreatePayload } from "./MarkdownTemplateTypes";

interface MarkdownTemplateCreateModalProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    creating: boolean;
    onCreate: (payload: MarkdownTemplateCreatePayload) => Promise<void>;
    onUpdate?: (templateUuid: string, payload: MarkdownTemplateCreatePayload) => Promise<void>;
    editingTemplate?: {
        uuid: string;
        title: string;
        description: string | null;
        visibility: "private" | "public" | "unlisted";
        template_text: string;
    } | null;
}

export default function MarkdownTemplateCreateModal({ open, setOpen, creating, onCreate, onUpdate, editingTemplate }: MarkdownTemplateCreateModalProps) {
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [templateText, setTemplateText] = useState<string>("## 제목\n- 항목 1\n- 항목 2");
    const [visibility, setVisibility] = useState<"private" | "public" | "unlisted">("private");
    const pointerDownInsidePanelRef = useRef<boolean>(false);
    const pointerDownOverlayRef = useRef<boolean>(false);

    useEffect(() => {
        if (!open) return;
        if (editingTemplate) {
            setTitle(editingTemplate.title);
            setDescription(editingTemplate.description ?? "");
            setVisibility(editingTemplate.visibility);
            setTemplateText(editingTemplate.template_text ?? "");
        } else {
            setTitle("");
            setDescription("");
            setTemplateText("## 제목\n- 항목 1\n- 항목 2");
            setVisibility("private");
        }
    }, [open, editingTemplate]);

    const canSubmit = useMemo(() => {
        return title.trim().length > 0 && templateText.trim().length > 0;
    }, [title, templateText]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[13100] bg-black/40 flex items-center justify-center px-3 sm:px-5 py-4"
            onMouseDown={(e) => {
                pointerDownOverlayRef.current = e.target === e.currentTarget;
                pointerDownInsidePanelRef.current = false;
            }}
            onMouseUp={(e) => {
                if (!creating && e.target === e.currentTarget && (pointerDownOverlayRef.current || pointerDownInsidePanelRef.current)) {
                    setOpen(false);
                }
                pointerDownOverlayRef.current = false;
                pointerDownInsidePanelRef.current = false;
            }}
        >
            <div
                className="w-full max-w-[720px] max-h-[92vh] rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 sm:p-5 flex flex-col"
                onMouseDown={() => {
                    pointerDownInsidePanelRef.current = true;
                }}
                onMouseUp={() => {
                    pointerDownOverlayRef.current = false;
                    pointerDownInsidePanelRef.current = false;
                }}
            >
                <h2 className="normal-text text-lg font-semibold">{editingTemplate ? "마크다운 템플릿 수정" : "마크다운 템플릿 만들기"}</h2>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {editingTemplate ? "수정 모드: 제목, 설명, 공개 범위, 텍스트를 모두 수정할 수 있습니다." : "캘린더(normal/dday)와 메모장에서 재사용할 템플릿을 만들어요."}
                </p>

                <div className="mt-3 flex-1 overflow-y-auto hidden-scroll space-y-3 pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                        <label className="form-label">제목</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="form-control"
                            placeholder="예: 주간 일정 정리"
                        />
                        </div>
                        <div>
                        <label className="form-label">설명</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="form-control"
                            placeholder="예: 매주 회고와 할 일 정리용"
                        />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">공개 범위</label>
                        <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className="form-control">
                            <option value="private">private</option>
                            <option value="public">public</option>
                            <option value="unlisted">unlisted</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">템플릿 본문 (Markdown)</label>
                        <textarea
                            value={templateText}
                            onChange={(e) => setTemplateText(e.target.value)}
                            className="form-control min-h-[240px] font-semibold"
                            placeholder="템플릿 본문을 입력하세요"
                        />
                    </div>
                </div>

                <div className="mt-3 bg-gray-50 dark:bg-gray-950 pt-2 border-t border-gray-300 dark:border-gray-800 flex items-center justify-end gap-2">
                    <button type="button" className="btn border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 normal-text" onClick={() => setOpen(false)} disabled={creating}>
                        닫기
                    </button>
                    <button
                        type="button"
                        disabled={!canSubmit || creating}
                        className="btn bg-blue-500 text-white disabled:opacity-60"
                        onClick={async () => {
                            if (!canSubmit || creating) return;
                            if (editingTemplate && onUpdate) {
                                await onUpdate(editingTemplate.uuid, {
                                    title: title.trim(),
                                    description: description.trim().length > 0 ? description.trim() : null,
                                    template_text: templateText,
                                    visibility,
                                });
                            } else {
                                await onCreate({
                                    title: title.trim(),
                                    description: description.trim().length > 0 ? description.trim() : null,
                                    template_text: templateText,
                                    visibility,
                                });
                            }
                        }}
                    >
                        {creating ? (editingTemplate ? "수정 중..." : "생성 중...") : (editingTemplate ? "템플릿 수정" : "템플릿 생성")}
                    </button>
                </div>
            </div>
        </div>
    , document.body
    );
}
