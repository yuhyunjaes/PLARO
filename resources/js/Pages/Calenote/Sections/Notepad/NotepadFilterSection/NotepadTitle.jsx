import FormInputWithButton from "@/Components/Elements/FormInputWithButton.jsx";
import {useState} from "react";
export default function NotepadTitle({ setSearchTitle, temporarySearchCategory, setSearchCategory }) {
    const [temporarySearchTitle, setTemporarySearchTitle] = useState("");

    return (
        <FormInputWithButton
            name="searchTitle"
            id="searchTitle"
            buttonText="검색"
            label="타이틀"
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
