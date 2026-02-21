import {Dispatch, SetStateAction} from "react";

interface TemplateSelectProps {
    challengeTemplateModal: {status: boolean, templateType: "mine" | "every" | null};
    setChallengeTemplateModal: Dispatch<SetStateAction<{status: boolean, templateType: "mine" | "every" | null}>>;
    setChallengeTemplateCreateModal: Dispatch<SetStateAction<boolean>>;
}

export default function TemplateSelect({challengeTemplateModal, setChallengeTemplateModal, setChallengeTemplateCreateModal}:TemplateSelectProps) {
    return (
        <div className="space-y-2">
            <button
                onClick={() => {setChallengeTemplateModal({status: true, templateType: "every"})}}
                type="button"
                className="btn w-full text-xs border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-100 hover:dark:bg-gray-800 normal-text"
            >
                공개 템플릿 고르기
            </button>
            <button
                onClick={() => {setChallengeTemplateModal({status: true, templateType: "mine"})}}
                type="button"
                className="btn w-full text-xs border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-100 hover:dark:bg-gray-800 normal-text"
            >
                내 템플릿 고르기
            </button>
            <button
                onClick={() => setChallengeTemplateCreateModal(true)}
                type="button"
                className="btn w-full text-xs border border-blue-500 text-blue-500 bg-white dark:bg-gray-950 hover:bg-blue-50 hover:dark:bg-blue-950/20"
            >
                템플릿 만들기
            </button>
        </div>
    );
}
