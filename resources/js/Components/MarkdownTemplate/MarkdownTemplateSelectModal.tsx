import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MarkdownTemplateItem } from "./MarkdownTemplateTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid, faUsers } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import Modal from "../Elements/Modal";

interface MarkdownTemplateSelectModalProps {
    open: boolean;
    templateType: "mine" | "every" | null;
    templates: MarkdownTemplateItem[];
    loading: boolean;
    fetchingMore: boolean;
    hasMore: boolean;
    error: string;
    searchKeyword: string;
    onClose: () => void;
    onSearchKeywordChange: (value: string) => void;
    onLoadMore: () => void;
    onApply: (template: MarkdownTemplateItem) => Promise<void> | void;
    onToggleLike: (template: MarkdownTemplateItem) => Promise<void> | void;
    onEditTemplate?: (template: MarkdownTemplateItem) => void;
    onDeleteTemplate?: (template: MarkdownTemplateItem) => Promise<void> | void;
}

export default function MarkdownTemplateSelectModal({
    open,
    templateType,
    templates,
    loading,
    fetchingMore,
    hasMore,
    error,
    searchKeyword,
    onClose,
    onSearchKeywordChange,
    onLoadMore,
    onApply,
    onToggleLike,
    onEditTemplate,
    onDeleteTemplate,
}: MarkdownTemplateSelectModalProps) {
    const [activeTemplateUuid, setActiveTemplateUuid] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [deleteTemplateUuid, setDeleteTemplateUuid] = useState<string>("");
    const [deleteEditStatus, setDeleteEditStatus] = useState<string>("");
    const pointerDownInsidePanelRef = useRef<boolean>(false);
    const pointerDownOverlayRef = useRef<boolean>(false);
    const templatesScrollRef = useRef<HTMLDivElement | null>(null);
    const activeTemplate = useMemo(
        () => templates.find((template) => template.uuid === activeTemplateUuid) ?? null,
        [templates, activeTemplateUuid]
    );
    const deleteTarget = useMemo(
        () => templates.find((template) => template.uuid === deleteTemplateUuid) ?? null,
        [templates, deleteTemplateUuid]
    );

    const confirmDeleteTemplate = async () => {
        if (!onDeleteTemplate || !deleteTarget) return;
        await onDeleteTemplate(deleteTarget);
    };

    useEffect(() => {
        const container = templatesScrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (loading || fetchingMore || !hasMore) return;
            const { scrollTop, clientHeight, scrollHeight } = container;
            if (scrollTop + clientHeight >= scrollHeight - 12) {
                onLoadMore();
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [loading, fetchingMore, hasMore, onLoadMore]);

    useEffect(() => {
        if (!activeTemplateUuid) return;
        const exists = templates.some((template) => template.uuid === activeTemplateUuid);
        if (!exists) {
            setActiveTemplateUuid(null);
        }
    }, [templates, activeTemplateUuid]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[13000] bg-black/35 flex justify-center items-center px-3 md:px-5 py-4"
                onMouseDown={(e) => {
                    pointerDownOverlayRef.current = e.target === e.currentTarget;
                    pointerDownInsidePanelRef.current = false;
                }}
                onMouseUp={(e) => {
                    if (e.target === e.currentTarget && (pointerDownOverlayRef.current || pointerDownInsidePanelRef.current)) {
                        onClose();
                    }
                    pointerDownOverlayRef.current = false;
                    pointerDownInsidePanelRef.current = false;
                }}
            >
                <div
                    className="w-full max-w-[620px] max-h-[92vh] rounded border border-gray-300 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 p-4 md:p-5 flex flex-col"
                    onMouseDown={() => {
                        pointerDownInsidePanelRef.current = true;
                    }}
                    onMouseUp={() => {
                        pointerDownOverlayRef.current = false;
                        pointerDownInsidePanelRef.current = false;
                    }}
                >
                    <h2 className="normal-text text-lg font-semibold">
                        {templateType === "every"
                            ? "마크다운 공개 템플릿 고르기"
                            : templateType === "mine"
                                ? "마크다운 내 템플릿 고르기"
                                : "마크다운 템플릿 고르기"}
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">선택한 템플릿은 현재 작성 중인 내용 아래에 추가됩니다.</p>

                    <div className="mt-3 flex-1 overflow-y-auto hidden-scroll pr-1">
                        {loading ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">템플릿을 불러오는 중입니다...</p>
                        ) : error ? (
                            <p className="text-xs text-red-500 py-6 text-center">{error}</p>
                        ) : templates.length <= 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">
                                {searchKeyword.trim().length > 0 ? "검색 결과가 없습니다." : "표시할 템플릿이 없습니다."}
                            </p>
                        ) : (
                            <div ref={templatesScrollRef} className="max-h-[42vh] md:max-h-[300px] rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-x-hidden overflow-y-auto grid grid-cols-1 gap-2 px-2 pb-2 pt-0">
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
                                        key={template.uuid}
                                        className={`w-full rounded border border-gray-300 dark:border-gray-800 p-3 transition-colors ${
                                            activeTemplateUuid === template.uuid
                                                ? "bg-gray-200 dark:bg-gray-800"
                                                : "bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 hover:dark:bg-gray-800"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTemplateUuid((prev) => (prev === template.uuid ? null : template.uuid))}
                                                className="min-w-0 flex-1 text-left"
                                            >
                                                <p className="text-sm font-semibold normal-text truncate">{template.title}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {template.description || "설명이 없는 템플릿"}
                                                </p>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-900 normal-text">{template.visibility}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-900 normal-text inline-flex items-center gap-1">
                                                        <FontAwesomeIcon icon={faUsers} />
                                                        {template.usage_count}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-900 normal-text inline-flex items-center gap-1">
                                                        <FontAwesomeIcon icon={faHeartSolid} className="text-rose-500" />
                                                        {template.like_count}
                                                    </span>
                                                    {template.owner_name === "Markdown System" ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500 text-white font-semibold">SYSTEM</span>
                                                    ) : null}
                                                </div>
                                            </button>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {templateType === "mine" ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => onEditTemplate?.(template)}
                                                            className="h-7 px-2 rounded border border-gray-300 dark:border-gray-700 text-[10px] normal-text bg-white dark:bg-gray-900 hover:bg-gray-100 hover:dark:bg-gray-800 transition-colors"
                                                        >
                                                            수정
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDeleteEditStatus("delete");
                                                                setDeleteTemplateUuid(template.uuid);
                                                                setDeleteModal(true);
                                                            }}
                                                            className="h-7 px-2 rounded border border-red-400 dark:border-red-800 text-[10px] text-red-500 bg-white dark:bg-gray-900 hover:bg-red-50 hover:dark:bg-red-950/30 transition-colors"
                                                        >
                                                            삭제
                                                        </button>
                                                    </>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleLike(template)}
                                                    className={`size-7 cursor-pointer rounded border border-gray-300 dark:border-gray-700 flex items-center justify-center transition-colors ${
                                                        template.liked
                                                            ? "text-red-500 bg-red-50 dark:bg-red-950/30"
                                                            : "text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-100 hover:dark:bg-gray-800"
                                                    }`}
                                                >
                                                    <FontAwesomeIcon icon={template.liked ? faHeartSolid : faHeartRegular} className="text-xs" />
                                                </button>
                                            </div>
                                        </div>

                                        <pre className="mt-2 text-[11px] normal-text whitespace-pre-wrap line-clamp-4 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-800 p-2">{template.template_text}</pre>
                                    </div>
                                ))}
                                {fetchingMore ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 py-2 text-center">더 불러오는 중...</p>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div className="mt-3 bg-gray-100 dark:bg-gray-950 pt-2 border-t border-gray-300 dark:border-gray-800 flex items-center justify-end gap-2">
                        <button type="button" className="btn border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 normal-text" onClick={onClose}>
                            닫기
                        </button>
                        <button
                            type="button"
                            disabled={!activeTemplate}
                            className="btn bg-blue-500 text-white disabled:opacity-60"
                            onClick={async () => {
                                if (!activeTemplate) return;
                                await onApply(activeTemplate);
                                setActiveTemplateUuid(null);
                                onClose();
                            }}
                        >
                            선택 템플릿 추가
                        </button>
                    </div>
                </div>
            </div>

            {deleteModal ? (
                <Modal
                    Title="템플릿 삭제"
                    Text={deleteTarget ? `"${deleteTarget.title}" 템플릿을 정말 삭제 하시겠습니까?` : "템플릿을 정말 삭제 하시겠습니까?"}
                    Position="top"
                    CloseText="삭제"
                    setEditStatus={setDeleteEditStatus}
                    setModal={setDeleteModal}
                    setEditId={setDeleteTemplateUuid}
                    onClickEvent={confirmDeleteTemplate}
                />
            ) : null}
        </>
    , document.body
    );
}
