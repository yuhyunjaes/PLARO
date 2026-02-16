import FormInputWithButton from "../../../../../Components/Elements/FormInputWithButton";
import {Dispatch, SetStateAction, useState} from "react";

interface NotepadTitleProps {
    setSearchTitle: Dispatch<SetStateAction<string>>;
    temporarySearchCategory: string;
    setSearchCategory: Dispatch<SetStateAction<string>>;
}

export default function NotepadTitle({ setSearchTitle, temporarySearchCategory, setSearchCategory }: NotepadTitleProps) {
    const [temporarySearchTitle, setTemporarySearchTitle] = useState("");

    return (
        <FormInputWithButton
            name="searchTitle"
            id="searchTitle"
            buttonText="검색"
            label="제목"
             className="!min-w-[280px]"
            value={temporarySearchTitle}
            onChange={(e) => {
                setTemporarySearchTitle(e.target.value);
            }}
            onButtonClick={() => {
                setSearchTitle(temporarySearchTitle);
                setSearchCategory(temporarySearchCategory);
            }}
        />
    );
}
