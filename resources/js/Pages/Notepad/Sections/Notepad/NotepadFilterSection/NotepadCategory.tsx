import {Dispatch, SetStateAction} from "react";
import {Category} from "../../../../../Types/AppTypes";

interface NotepadCategoryProps {
    categories: string[];
    temporarySearchCategory: string;
    setTemporarySearchCategory: Dispatch<SetStateAction<string>>;
}

export default function NotepadCategory({ categories, temporarySearchCategory, setTemporarySearchCategory  } : NotepadCategoryProps) {

    return (
        <div className="my-3 sm:my-0">
            <label htmlFor="category" className="form-label">카테고리</label>
            <select
                name="category"
                id="category"
                className="select-control"
                value={temporarySearchCategory}
                onChange={(e) => setTemporarySearchCategory(e.target.value)}
            >
                <option value=" ">카테고리를 선택해주세요.</option>
                {categories.map((item, index) => (
                    <option key={index} value={item}>{item}</option>
                ))}
            </select>
        </div>
    );
}
