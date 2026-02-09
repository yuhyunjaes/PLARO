import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import Quill from "quill";
import 'quill/dist/quill.snow.css';

interface WriteSectionProps {
    notepadText: string;
    setNotepadText: Dispatch<SetStateAction<string>>;
    setSaveStatus: Dispatch<SetStateAction<boolean>>;
    handleSaveNotepadContent: (content: string) => Promise<void>;
}

export default function WriteSection({
    setNotepadText,
    notepadText,
    setSaveStatus,
    handleSaveNotepadContent
}: WriteSectionProps) {

    const quillRef = useRef<HTMLDivElement | null>(null);
    const quillInstance = useRef<Quill | null>(null);
    const timer = useRef<number | null>(null);

    // 최신 notepadText 보관용 ref
    const notepadTextRef = useRef(notepadText);
    useEffect(() => {
        notepadTextRef.current = notepadText;
    }, [notepadText]);

    useEffect(() => {
        if (quillInstance.current) return;

        const toolbarOptions = [
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
        ];

        const quill = new Quill(quillRef.current as HTMLDivElement, {
            theme: 'snow',
            placeholder: '메모를 작성하세요...',
            modules: {
                toolbar: toolbarOptions,
                clipboard: {
                    matchVisual: false,
                },
            },
        });

        // 초기값 세팅
        if (notepadText) {
            (quill.clipboard as any).dangerouslyPasteHTML(notepadText);
        } else {
            quill.setText("");
        }

        quill.history.clear();

        // 텍스트 변경 이벤트
        quill.on("text-change", () => {
            const html = quill.root.innerHTML;
            setNotepadText(html);

            if (timer.current) clearTimeout(timer.current);
            setSaveStatus(true);

            timer.current = setTimeout(() => {
                handleSaveNotepadContent(notepadTextRef.current);
            }, 500);
        });

        quillInstance.current = quill;
    }, []);

    return (
        <div className="write-notepad flex flex-col flex-1 bg-gray-100 dark:bg-gray-950">
            <div ref={quillRef} className="flex-1" />
        </div>
    );
}
