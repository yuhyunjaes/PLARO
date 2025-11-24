import { useState } from "react";

export default function NotepadCategory({ categories, temporarySearchCategory, setTemporarySearchCategory  }) {

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
                    <option key={index} value={item.category}>{item.category}</option>
                ))}
            </select>
        </div>
    );
}
