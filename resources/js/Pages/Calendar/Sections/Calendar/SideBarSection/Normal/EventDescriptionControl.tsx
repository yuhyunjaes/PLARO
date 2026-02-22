import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBold, faCheckSquare, faCode, faExpand, faGripLines, faHeading, faItalic, faLink, faListOl, faListUl, faQuoteRight, faTableCells, faXmark } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import MarkdownTemplateSelectModal from "../../../../../../Components/MarkdownTemplate/MarkdownTemplateSelectModal";
import MarkdownTemplateCreateModal from "../../../../../../Components/MarkdownTemplate/MarkdownTemplateCreateModal";
import { MarkdownTemplateCreatePayload, MarkdownTemplateItem } from "../../../../../../Components/MarkdownTemplate/MarkdownTemplateTypes";

interface EventDescriptionControlProps {
    disabled: boolean;
    updateEvent: () => Promise<void>;
    eventDescription: string | null;
    setEventDescription: Dispatch<SetStateAction<string>>;
    aiSourceText: string;
    setAiSourceText: Dispatch<SetStateAction<string>>;
    aiSummary: string;
    aiSummarizing: boolean;
    summarizeWithAi: () => Promise<void>;
    applySummaryToDescription: () => void;
    onEditingStatusChange?: (editing: boolean) => void;
}

export default function EventDescriptionControl({
    disabled,
    updateEvent,
    eventDescription,
    setEventDescription,
    aiSourceText,
    setAiSourceText,
    aiSummary,
    aiSummarizing,
    summarizeWithAi,
    applySummaryToDescription,
    onEditingStatusChange
}: EventDescriptionControlProps) {
    const timer = useRef<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const overlayDragCloseRef = useRef<boolean>(false);
    const editingIdleTimerRef = useRef<number | null>(null);
    const [expanded, setExpanded] = useState<boolean>(false);
    const [mobilePanel, setMobilePanel] = useState<"write" | "preview">("write");
    const [colorTarget, setColorTarget] = useState<"text" | "bg">("text");
    const [customColor, setCustomColor] = useState<string>("#2563eb");
    const [showAiInputGuide, setShowAiInputGuide] = useState<boolean>(false);
    const [aiSummaryOpen, setAiSummaryOpen] = useState<boolean>(false);
    const [templateModal, setTemplateModal] = useState<{ open: boolean; type: "mine" | "every" | null }>({
        open: false,
        type: null,
    });
    const [templateCreateOpen, setTemplateCreateOpen] = useState<boolean>(false);
    const [templateLoading, setTemplateLoading] = useState<boolean>(false);
    const [templateFetchingMore, setTemplateFetchingMore] = useState<boolean>(false);
    const [templatePage, setTemplatePage] = useState<number>(1);
    const [templateLastPage, setTemplateLastPage] = useState<number>(1);
    const [templateSearchKeyword, setTemplateSearchKeyword] = useState<string>("");
    const [templateCreating, setTemplateCreating] = useState<boolean>(false);
    const [templateError, setTemplateError] = useState<string>("");
    const [templates, setTemplates] = useState<MarkdownTemplateItem[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<MarkdownTemplateItem | null>(null);
    const templateFetchRequestIdRef = useRef<number>(0);
    const safeDescription = eventDescription ?? "";

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);

        timer.current = window.setTimeout(() => {
            updateEvent();
        }, 500);

        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [safeDescription]);

    useEffect(() => {
        if (!expanded) return;
        setMobilePanel("write");

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setExpanded(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [expanded]);

    useEffect(() => {
        return () => {
            if (editingIdleTimerRef.current) {
                clearTimeout(editingIdleTimerRef.current);
            }
            onEditingStatusChange?.(false);
        };
    }, [onEditingStatusChange]);

    const notifyEditingActive = () => {
        onEditingStatusChange?.(true);
        if (editingIdleTimerRef.current) {
            clearTimeout(editingIdleTimerRef.current);
        }
        editingIdleTimerRef.current = window.setTimeout(() => {
            onEditingStatusChange?.(false);
        }, 2500);
    };

    const markdownToHtml = (markdown: string): string => {
        const escapeHtml = (raw: string): string =>
            raw
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const normalizeColorToken = (token: string): string => {
            const value = token.trim();
            if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value;
            if (/^[a-zA-Z]+$/.test(value)) return value;
            return "inherit";
        };

        const renderInline = (raw: string): string => {
            const escaped = escapeHtml(raw);
            return escaped
                .replace(/`([^`]+)`/g, "<code>$1</code>")
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
                .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>")
                .replace(/~~([^~]+)~~/g, "<del>$1</del>")
                .replace(
                    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
                    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
                )
                .replace(
                    /(^|[\s(])(https?:\/\/[^\s<]+)/g,
                    '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>'
                )
                .replace(/\{red\}([\s\S]*?)\{\/red\}/g, '<span class="md-color-red">$1</span>')
                .replace(/\{bg-red\}([\s\S]*?)\{\/bg-red\}/g, '<span class="md-bg-red">$1</span>')
                .replace(/\{color:([^}]+)\}([\s\S]*?)\{\/color\}/g, (_, color, text) => {
                    const safeColor = normalizeColorToken(String(color));
                    return `<span style="color:${safeColor};">${text}</span>`;
                })
                .replace(/\{bg:([^}]+)\}([\s\S]*?)\{\/bg\}/g, (_, color, text) => {
                    const safeColor = normalizeColorToken(String(color));
                    return `<span style="background-color:${safeColor};padding:0 4px;border-radius:4px;">${text}</span>`;
                });
        };

        const lines = markdown.replace(/\r\n/g, "\n").split("\n");
        const html: string[] = [];
        let inUl = false;
        let inOl = false;
        let inCodeBlock = false;
        let codeLang = "";
        let codeLines: string[] = [];
        let tableLines: string[] = [];

        const closeLists = () => {
            if (inUl) html.push("</ul>");
            if (inOl) html.push("</ol>");
            inUl = false;
            inOl = false;
        };

        const closeCodeBlock = () => {
            if (!inCodeBlock) return;
            const safeCode = escapeHtml(codeLines.join("\n"));
            const langClass = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : "";
            html.push(`<pre><code${langClass}>${safeCode}</code></pre>`);
            inCodeBlock = false;
            codeLang = "";
            codeLines = [];
        };

        const parseTableRow = (line: string): string[] => {
            return line
                .trim()
                .replace(/^\|/, "")
                .replace(/\|$/, "")
                .split("|")
                .map((cell) => cell.trim());
        };

        const isSeparatorRow = (cells: string[]): boolean => {
            return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
        };

        const closeTable = () => {
            if (tableLines.length <= 0) return;
            const rows = tableLines.map(parseTableRow);
            const hasHeadSeparator = rows.length > 1 && isSeparatorRow(rows[1] ?? []);
            if (!hasHeadSeparator) {
                for (const line of tableLines) {
                    html.push(`<p>${renderInline(line)}</p>`);
                }
                tableLines = [];
                return;
            }
            const header = rows[0] ?? [];
            const bodyRows = hasHeadSeparator ? rows.slice(2) : rows.slice(1);

            html.push("<table>");
            if (header.length > 0) {
                html.push("<thead><tr>");
                for (const cell of header) {
                    html.push(`<th>${renderInline(cell)}</th>`);
                }
                html.push("</tr></thead>");
            }

            if (bodyRows.length > 0) {
                html.push("<tbody>");
                for (const row of bodyRows) {
                    html.push("<tr>");
                    for (const cell of row) {
                        html.push(`<td>${renderInline(cell)}</td>`);
                    }
                    html.push("</tr>");
                }
                html.push("</tbody>");
            }

            html.push("</table>");
            tableLines = [];
        };

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith("```")) {
                closeTable();
                closeLists();
                if (inCodeBlock) {
                    closeCodeBlock();
                } else {
                    inCodeBlock = true;
                    codeLang = trimmed.replace(/^```/, "").trim();
                    codeLines = [];
                }
                continue;
            }

            if (inCodeBlock) {
                codeLines.push(line);
                continue;
            }

            if (/^\|.+\|$/.test(trimmed)) {
                tableLines.push(trimmed);
                continue;
            } else if (tableLines.length > 0) {
                closeTable();
            }

            if (!trimmed) {
                closeLists();
                closeTable();
                html.push("<br />");
                continue;
            }

            if (trimmed === "---" || trimmed === "***") {
                closeLists();
                html.push("<hr />");
                continue;
            }

            const checkItem = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
            if (checkItem) {
                if (inOl) {
                    html.push("</ol>");
                    inOl = false;
                }
                if (!inUl) {
                    html.push('<ul class="md-check">');
                    inUl = true;
                }
                const checked = (checkItem[1] ?? "").toLowerCase() === "x";
                const checkLabel = checkItem[2] ?? "";
                html.push(
                    `<li><span>${checked ? "☑" : "☐"}</span> ${renderInline(checkLabel)}</li>`
                );
                continue;
            }

            const ulItem = trimmed.match(/^[-*]\s+(.+)$/);
            if (ulItem) {
                if (inOl) {
                    html.push("</ol>");
                    inOl = false;
                }
                if (!inUl) {
                    html.push("<ul>");
                    inUl = true;
                }
                html.push(`<li>${renderInline(ulItem[1] ?? "")}</li>`);
                continue;
            }

            const olItem = trimmed.match(/^\d+\.\s+(.+)$/);
            if (olItem) {
                if (inUl) {
                    html.push("</ul>");
                    inUl = false;
                }
                if (!inOl) {
                    html.push("<ol>");
                    inOl = true;
                }
                html.push(`<li>${renderInline(olItem[1] ?? "")}</li>`);
                continue;
            }

            closeLists();

            const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (heading) {
                const level = (heading[1] ?? "#").length;
                html.push(`<h${level}>${renderInline(heading[2] ?? "")}</h${level}>`);
                continue;
            }

            const quote = trimmed.match(/^>\s+(.+)$/);
            if (quote) {
                html.push(`<blockquote>${renderInline(quote[1] ?? "")}</blockquote>`);
                continue;
            }

            html.push(`<p>${renderInline(trimmed)}</p>`);
        }

        closeCodeBlock();
        closeTable();
        closeLists();
        return html.join("");
    };

    const renderedPreview = useMemo(() => markdownToHtml(safeDescription), [safeDescription]);
    const renderedAiSummary = useMemo(() => markdownToHtml(aiSummary ?? ""), [aiSummary]);
    const lineCount = useMemo(() => (safeDescription ? safeDescription.split("\n").length : 0), [safeDescription]);

    const insertAtCursor = (
        prefix: string,
        suffix = "",
        defaultText = ""
    ) => {
        if (disabled) return;

        const textarea = textareaRef.current;
        if (!textarea) {
            setEventDescription((prev) => `${prev ?? ""}${prefix}${defaultText}${suffix}`);
            return;
        }

        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const selected = safeDescription.slice(start, end);
        const inner = selected || defaultText;
        const next = `${safeDescription.slice(0, start)}${prefix}${inner}${suffix}${safeDescription.slice(end)}`;

        setEventDescription(next);

        const cursor = start + prefix.length + inner.length + suffix.length;
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(cursor, cursor);
        });
    };

    const toolbarButtons = [
        { key: "h2", label: "제목", icon: faHeading, onClick: () => insertAtCursor("## ", "", "일정 제목") },
        { key: "ul", label: "목록", icon: faListUl, onClick: () => insertAtCursor("- ", "", "항목") },
        { key: "ol", label: "번호", icon: faListOl, onClick: () => insertAtCursor("1. ", "", "순서") },
        { key: "check", label: "체크", icon: faCheckSquare, onClick: () => insertAtCursor("- [ ] ", "", "할 일") },
        { key: "bold", label: "굵게", icon: faBold, onClick: () => insertAtCursor("**", "**", "강조") },
        { key: "italic", label: "기울임", icon: faItalic, onClick: () => insertAtCursor("*", "*", "텍스트") },
        { key: "code", label: "코드", icon: faCode, onClick: () => insertAtCursor("`", "`", "code") },
        { key: "quote", label: "인용", icon: faQuoteRight, onClick: () => insertAtCursor("> ", "", "메모") },
        { key: "link", label: "링크", icon: faLink, onClick: () => insertAtCursor("[", "](https://)", "텍스트") },
        {
            key: "codeblock",
            label: "코드블록",
            icon: faCode,
            onClick: () => insertAtCursor("```txt\n", "\n```", "내용"),
        },
        {
            key: "table",
            label: "표",
            icon: faTableCells,
            onClick: () => insertAtCursor(
                "| 항목 | 내용 |\n| --- | --- |\n",
                "",
                "| 예시 | 값 |"
            ),
        },
        { key: "hr", label: "구분선", icon: faGripLines, onClick: () => insertAtCursor("\n---\n", "", "") },
    ];
    const colorPresets = [
        { key: "red", label: "빨강", hex: "#ef4444", className: "bg-red-500/20 border-red-300/70 dark:border-red-700/60" },
        { key: "blue", label: "파랑", hex: "#3b82f6", className: "bg-blue-500/20 border-blue-300/70 dark:border-blue-700/60" },
        { key: "green", label: "초록", hex: "#22c55e", className: "bg-green-500/20 border-green-300/70 dark:border-green-700/60" },
        { key: "amber", label: "주황", hex: "#f59e0b", className: "bg-amber-500/20 border-amber-300/70 dark:border-amber-700/60" },
        { key: "violet", label: "보라", hex: "#8b5cf6", className: "bg-violet-500/20 border-violet-300/70 dark:border-violet-700/60" },
    ];

    const quickTemplates: Array<{ key: string; label: string; value: string }> = [
        {
            key: "schedule",
            label: "일정",
            value:
                "## 일정\n- 09:00 시작\n- 13:00 점심\n- 16:00 마무리",
        },
        {
            key: "checklist",
            label: "체크리스트",
            value:
                "## 체크리스트\n- [ ] 항목 1\n- [ ] 항목 2\n- [ ] 항목 3",
        },
        {
            key: "table",
            label: "테이블",
            value:
                "## 테이블\n| 항목 | 내용 |\n| --- | --- |\n| 예시 1 | 값 |\n| 예시 2 | 값 |",
        },
    ];

    const appendTemplate = (value: string) => {
        if (disabled) return;
        setEventDescription((prev) => {
            const current = prev ?? "";
            if (!current.trim()) return value;
            return `${current}\n\n${value}`;
        });
    };
    const handleSummarizeClick = async () => {
        if (disabled || aiSummarizing) return;
        if ((aiSourceText ?? "").trim().length <= 0) {
            setShowAiInputGuide(true);
            return;
        }
        setShowAiInputGuide(false);
        await summarizeWithAi();
    };
    const loadTemplates = async (type: "mine" | "every", page: number, append: boolean, keyword: string): Promise<void> => {
        const requestId = ++templateFetchRequestIdRef.current;
        if (append) {
            setTemplateFetchingMore(true);
        } else {
            setTemplateLoading(true);
            setTemplateError("");
        }
        try {
            const res = await axios.get("/api/markdown-templates", {
                params: { template_type: type, page, keyword },
            });
            if (templateFetchRequestIdRef.current !== requestId) return;
            if (!res.data?.success) {
                setTemplateError(res.data?.message ?? "템플릿을 불러오지 못했습니다.");
                return;
            }
            const incoming = res.data.templates ?? [];
            setTemplates((prev) => {
                const merged: MarkdownTemplateItem[] = append ? [...prev, ...incoming] : incoming;
                return Array.from(
                    new Map<string, MarkdownTemplateItem>(merged.map((item) => [item.uuid, item])).values()
                );
            });
            setTemplatePage(Number(res.data?.pagination?.current_page ?? page));
            setTemplateLastPage(Number(res.data?.pagination?.last_page ?? page));
        } catch (e: any) {
            if (templateFetchRequestIdRef.current !== requestId) return;
            setTemplateError(e?.response?.data?.message ?? "템플릿을 불러오지 못했습니다.");
        } finally {
            if (templateFetchRequestIdRef.current !== requestId) return;
            if (append) {
                setTemplateFetchingMore(false);
            } else {
                setTemplateLoading(false);
            }
        }
    };
    const openTemplatePicker = async (type: "mine" | "every") => {
        setTemplateSearchKeyword("");
        setTemplateModal({ open: true, type });
    };
    const loadMoreTemplates = async () => {
        if (templateLoading || templateFetchingMore) return;
        if (!templateModal.type) return;
        if (templatePage >= templateLastPage) return;
        await loadTemplates(templateModal.type, templatePage + 1, true, templateSearchKeyword);
    };
    useEffect(() => {
        if (!templateModal.open || !templateModal.type) return;
        const timerId = window.setTimeout(() => {
            loadTemplates(templateModal.type as "mine" | "every", 1, false, templateSearchKeyword);
        }, 180);
        return () => window.clearTimeout(timerId);
    }, [templateSearchKeyword, templateModal.open, templateModal.type]);
    const createTemplate = async (payload: MarkdownTemplateCreatePayload): Promise<void> => {
        setTemplateCreating(true);
        try {
            const res = await axios.post("/api/markdown-templates", payload);
            if (!res.data?.success) {
                setTemplateError(res.data?.message ?? "템플릿 생성에 실패했습니다.");
                return;
            }
            setTemplateCreateOpen(false);
        } catch (e: any) {
            setTemplateError(e?.response?.data?.message ?? "템플릿 생성에 실패했습니다.");
        } finally {
            setTemplateCreating(false);
        }
    };
    const updateTemplate = async (templateUuid: string, payload: MarkdownTemplateCreatePayload): Promise<void> => {
        setTemplateCreating(true);
        try {
            const res = await axios.put(`/api/markdown-templates/${templateUuid}`, payload);
            if (!res.data?.success) {
                setTemplateError(res.data?.message ?? "템플릿 수정에 실패했습니다.");
                return;
            }
            const updated = res.data.template as MarkdownTemplateItem | undefined;
            if (updated) {
                setTemplates((prev) =>
                    prev.map((item) => (item.uuid === templateUuid ? { ...item, ...updated } : item))
                );
            }
            setTemplateCreateOpen(false);
            setTemplateModal({ open: true, type: "mine" });
            setEditingTemplate(null);
        } catch (e: any) {
            setTemplateError(e?.response?.data?.message ?? "템플릿 수정에 실패했습니다.");
        } finally {
            setTemplateCreating(false);
        }
    };
    const applyServerTemplate = async (template: MarkdownTemplateItem): Promise<void> => {
        appendTemplate(template.template_text ?? "");
        try {
            await axios.post(`/api/markdown-templates/${template.uuid}/usage`);
        } catch (_) {
        }
    };
    const toggleTemplateLike = async (template: MarkdownTemplateItem): Promise<void> => {
        const endpoint = `/api/markdown-templates/${template.uuid}/like`;
        try {
            if (template.liked) {
                await axios.delete(endpoint);
            } else {
                await axios.post(endpoint);
            }
            setTemplates((prev) =>
                prev
                    .map((item) => {
                        if (item.uuid !== template.uuid) return item;
                        const liked = !item.liked;
                        const nextLikeCount = Math.max(0, (item.like_count ?? 0) + (liked ? 1 : -1));
                        return { ...item, liked, like_count: nextLikeCount };
                    })
                    .sort((a, b) => {
                        if ((b.like_count ?? 0) !== (a.like_count ?? 0)) return (b.like_count ?? 0) - (a.like_count ?? 0);
                        if ((b.usage_count ?? 0) !== (a.usage_count ?? 0)) return (b.usage_count ?? 0) - (a.usage_count ?? 0);
                        return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
                    })
            );
        } catch (_) {
        }
    };
    const deleteTemplate = async (template: MarkdownTemplateItem): Promise<void> => {
        try {
            const res = await axios.delete(`/api/markdown-templates/${template.uuid}`);
            if (!res.data?.success) {
                setTemplateError(res.data?.message ?? "템플릿 삭제에 실패했습니다.");
                return;
            }
            setTemplates((prev) => prev.filter((item) => item.uuid !== template.uuid));
            if (editingTemplate?.uuid === template.uuid) {
                setEditingTemplate(null);
            }
        } catch (e: any) {
            setTemplateError(e?.response?.data?.message ?? "템플릿 삭제에 실패했습니다.");
        }
    };

    return (
        <div className="px-5 flex flex-wrap">
            <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold normal-text">설명 (Markdown)</p>
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="text-[11px] normal-text px-2 py-1 rounded border border-gray-300 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <FontAwesomeIcon icon={faExpand} className="mr-1" />
                        크게 편집
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="w-full text-left rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-3 min-h-[90px] max-h-[180px] overflow-auto hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                    title="클릭해서 크게 편집"
                >
                    {safeDescription.trim().length > 0 ? (
                        <div
                            className="md-preview text-xs normal-text leading-5"
                            dangerouslySetInnerHTML={{ __html: renderedPreview }}
                        />
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">일정, 체크리스트, 링크 등을 Markdown으로 작성해보세요.</p>
                    )}
                </button>
            </div>

            {expanded && typeof document !== "undefined" ? createPortal(
                <div
                    className="fixed inset-0 z-[12000] bg-black/60 p-3 md:p-4"
                    onMouseDown={(e) => {
                        overlayDragCloseRef.current = e.target === e.currentTarget;
                    }}
                    onMouseUp={(e) => {
                        if (overlayDragCloseRef.current && e.target === e.currentTarget) {
                            setExpanded(false);
                        }
                        overlayDragCloseRef.current = false;
                    }}
                >
                    <div
                        className="w-full h-full md:max-w-6xl md:mx-auto rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 md:px-6 py-3 border-b border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                            <div>
                                <p className="text-sm md:text-base font-semibold normal-text">Markdown 일정 편집</p>
                                <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400">텍스트, 리스트, 표 등 블록을 조합해 자유롭게 작성하세요.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExpanded(false)}
                                className="modal-close-btn text-gray-900 dark:text-white"
                                aria-label="닫기"
                            >
                                <FontAwesomeIcon icon={faXmark} className="pointer-events-none text-xs md:text-sm text-gray-900 dark:text-white" />
                            </button>
                        </div>

                        <div className="md:hidden px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-300 dark:border-gray-800">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMobilePanel("write")}
                                    className={`rounded py-2 text-xs font-semibold transition-colors ${
                                        mobilePanel === "write"
                                            ? "bg-blue-500 text-white"
                                            : "border border-gray-300 dark:border-gray-800 normal-text"
                                    }`}
                                >
                                    작성
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMobilePanel("preview")}
                                    className={`rounded py-2 text-xs font-semibold transition-colors ${
                                        mobilePanel === "preview"
                                            ? "bg-blue-500 text-white"
                                            : "border border-gray-300 dark:border-gray-800 normal-text"
                                    }`}
                                >
                                    미리보기
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
                            <div className={`p-3 md:p-4 border-b md:border-b-0 md:border-r border-gray-300 dark:border-gray-800 flex flex-col overflow-y-auto hidden-scroll bg-white dark:bg-gray-950 ${mobilePanel === "preview" ? "hidden md:flex" : ""}`}>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <p className="text-xs font-semibold normal-text">작성</p>
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{lineCount} lines</span>
                                </div>
                                <div className="mb-2 rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-2 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[11px] font-semibold normal-text">AI 정리</p>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">설명과 별도로 저장됩니다</span>
                                    </div>
                                    <textarea
                                        disabled={disabled}
                                        className="w-full min-h-[64px] max-h-[120px] border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-xs p-2 outline-none resize-y normal-text"
                                        placeholder="정리할 메모/생각을 입력하고 AI 정리를 요청하세요."
                                        value={aiSourceText}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setAiSourceText(value);
                                            if (value.trim().length > 0) {
                                                setShowAiInputGuide(false);
                                            }
                                        }}
                                    />
                                    {showAiInputGuide ? (
                                        <p className="text-[11px] text-red-600 dark:text-red-300">정리할 텍스트를 먼저 입력해주세요.</p>
                                    ) : null}
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            disabled={disabled || aiSummarizing}
                                            onClick={handleSummarizeClick}
                                            className="inline-flex items-center px-2.5 py-1.5 rounded border border-blue-500 bg-blue-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-60"
                                        >
                                            {aiSummarizing ? "AI 정리 중..." : "AI 정리 요청"}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={disabled || (aiSummary ?? "").trim().length <= 0}
                                            onClick={applySummaryToDescription}
                                            className="inline-flex items-center px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-[11px] font-semibold normal-text transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
                                        >
                                            정리 결과를 설명에 반영
                                        </button>
                                    </div>
                                    <div className="rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-semibold normal-text">AI 정리 결과</p>
                                            <button
                                                type="button"
                                                onClick={() => setAiSummaryOpen((prev) => !prev)}
                                                className="text-[11px] font-semibold px-2 py-1 rounded border border-gray-300 dark:border-gray-700 normal-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                {aiSummaryOpen ? "요약 숨기기" : "요약 보기"}
                                            </button>
                                        </div>
                                        {aiSummaryOpen ? (
                                            <div className="max-h-[88px] overflow-y-auto mt-1.5">
                                                {(aiSummary ?? "").trim().length > 0 ? (
                                                    <div
                                                        className="md-preview text-xs normal-text leading-5"
                                                        dangerouslySetInnerHTML={{ __html: renderedAiSummary }}
                                                    />
                                                ) : (
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">아직 생성된 정리 결과가 없습니다.</p>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">블록 도구</p>
                                <div className="mb-2 flex flex-wrap gap-1.5">
                                    {toolbarButtons.map((tool) => (
                                        <button
                                            key={tool.key}
                                            type="button"
                                            disabled={disabled}
                                            onClick={tool.onClick}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-[11px] normal-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                            title={tool.label}
                                        >
                                            <FontAwesomeIcon icon={tool.icon} />
                                            <span>{tool.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setColorTarget("text")}
                                        className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors ${
                                            colorTarget === "text"
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "border-gray-300 dark:border-gray-700 normal-text"
                                        }`}
                                    >
                                        텍스트색
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setColorTarget("bg")}
                                        className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors ${
                                            colorTarget === "bg"
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "border-gray-300 dark:border-gray-700 normal-text"
                                        }`}
                                    >
                                        배경색
                                    </button>
                                    {colorPresets.map((color) => (
                                        <button
                                            key={`preset-${color.key}`}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() =>
                                                colorTarget === "text"
                                                    ? insertAtCursor(`{color:${color.hex}}`, "{/color}", color.label)
                                                    : insertAtCursor(`{bg:${color.hex}}`, "{/bg}", color.label)
                                            }
                                            className={`inline-flex items-center px-2 py-1 rounded border text-[11px] font-semibold transition-colors disabled:opacity-50 normal-text ${color.className}`}
                                        >
                                            {color.label}
                                        </button>
                                    ))}
                                    <input
                                        type="color"
                                        value={customColor}
                                        onChange={(e) => setCustomColor(e.target.value)}
                                        className="size-7 rounded border border-gray-300 dark:border-gray-700 bg-transparent cursor-pointer"
                                        aria-label="커스텀 색상"
                                    />
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() =>
                                            colorTarget === "text"
                                                ? insertAtCursor(`{color:${customColor}}`, "{/color}", "텍스트")
                                                : insertAtCursor(`{bg:${customColor}}`, "{/bg}", "텍스트")
                                        }
                                        className="inline-flex items-center px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-[11px] font-semibold normal-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        적용
                                    </button>
                                </div>
                                <div className="mb-2">
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">템플릿 블록 (추가형)</p>
                                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                                        <button
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => openTemplatePicker("every")}
                                            className="inline-flex items-center px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-[11px] normal-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            공개 템플릿 고르기
                                        </button>
                                        <button
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => openTemplatePicker("mine")}
                                            className="inline-flex items-center px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-[11px] normal-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            내 템플릿 고르기
                                        </button>
                                        <button
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => {
                                                setEditingTemplate(null);
                                                setTemplateCreateOpen(true);
                                            }}
                                            className="inline-flex items-center px-2 py-1 rounded border border-blue-500 text-[11px] text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50"
                                        >
                                            템플릿 만들기
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                    {quickTemplates.map((template) => (
                                        <button
                                            key={template.key}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => appendTemplate(template.value)}
                                            className="inline-flex items-center px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-[11px] normal-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            {template.label}
                                        </button>
                                    ))}
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                        테이블 셀 안에서도 <code>{"{color:#hex}...{/color}"}</code> 또는 <code>{"{bg:#hex}...{/bg}"}</code> 문법 사용 가능
                                    </p>
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    disabled={disabled}
                                    id="eventDescription"
                                    className="flex-1 min-h-[260px] md:min-h-[320px] border bg-white rounded outline-none border-gray-300 dark:border-gray-700 w-full text-gray-900 font-semibold text-xs p-3 resize-none"
                                    placeholder="예) # 이번 주 일정\n- [ ] 준비 항목\n- [ ] 공유할 링크"
                                    value={safeDescription}
                                    onFocus={notifyEditingActive}
                                    onBlur={() => onEditingStatusChange?.(false)}
                                    onChange={(e) => {
                                        setEventDescription(e.target.value);
                                        notifyEditingActive();
                                    }}
                                />
                                {disabled ? (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">편집 권한이 없어 읽기 전용입니다.</p>
                                ) : null}
                            </div>
                            <div className={`p-3 md:p-4 overflow-auto bg-gray-50/70 dark:bg-gray-900/30 ${mobilePanel === "write" ? "hidden md:block" : ""}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold normal-text">미리보기</p>
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400">실시간 반영</span>
                                </div>
                                {safeDescription.trim().length > 0 ? (
                                    <div
                                        className="md-preview text-sm normal-text leading-6 rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 md:p-4"
                                        dangerouslySetInnerHTML={{ __html: renderedPreview }}
                                    />
                                ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">내용을 입력하면 여기에 미리보기가 표시됩니다.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            , document.body) : null}
            <MarkdownTemplateSelectModal
                open={templateModal.open}
                templateType={templateModal.type}
                templates={templates}
                loading={templateLoading}
                fetchingMore={templateFetchingMore}
                hasMore={templatePage < templateLastPage}
                error={templateError}
                searchKeyword={templateSearchKeyword}
                onClose={() => setTemplateModal({ open: false, type: null })}
                onSearchKeywordChange={setTemplateSearchKeyword}
                onLoadMore={loadMoreTemplates}
                onApply={applyServerTemplate}
                onToggleLike={toggleTemplateLike}
                onEditTemplate={(template) => {
                    setEditingTemplate(template);
                    setTemplateModal({ open: false, type: null });
                    setTemplateCreateOpen(true);
                }}
                onDeleteTemplate={deleteTemplate}
            />
            <MarkdownTemplateCreateModal
                open={templateCreateOpen}
                setOpen={setTemplateCreateOpen}
                creating={templateCreating}
                onCreate={createTemplate}
                onUpdate={updateTemplate}
                editingTemplate={editingTemplate}
            />
        </div>
    );
}
