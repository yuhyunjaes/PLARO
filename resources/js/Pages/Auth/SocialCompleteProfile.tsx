import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import FormInput from "../../Components/Elements/FormInput";

interface SocialCompleteProfileProps {
    provider: "kakao" | "google" | "facebook" | "social";
    missing_email: boolean;
    missing_nationality: boolean;
    email: string;
    nationality: string | null;
}

export default function SocialCompleteProfile({
    provider,
    missing_email,
    missing_nationality,
    email,
    nationality
}: SocialCompleteProfileProps) {
    const [currentEmail, setCurrentEmail] = useState(email ?? "");
    const [currentNationality, setCurrentNationality] = useState(nationality ?? "");

    const nationalityOptions = useMemo(() => [
        { code: "KR", label: "대한민국" },
        { code: "JP", label: "일본" },
        { code: "CN", label: "중국" },
        { code: "TW", label: "대만" },
        { code: "HK", label: "홍콩" },
        { code: "SG", label: "싱가포르" },
        { code: "TH", label: "태국" },
        { code: "VN", label: "베트남" },
        { code: "PH", label: "필리핀" },
        { code: "ID", label: "인도네시아" },
        { code: "IN", label: "인도" },
        { code: "AE", label: "아랍에미리트" },
        { code: "SA", label: "사우디아라비아" },
        { code: "TR", label: "튀르키예" },
        { code: "DE", label: "독일" },
        { code: "FR", label: "프랑스" },
        { code: "GB", label: "영국" },
        { code: "IT", label: "이탈리아" },
        { code: "ES", label: "스페인" },
        { code: "NL", label: "네덜란드" },
        { code: "RU", label: "러시아" },
        { code: "AU", label: "호주" },
        { code: "NZ", label: "뉴질랜드" },
        { code: "CA", label: "캐나다" },
        { code: "US", label: "미국" },
        { code: "MX", label: "멕시코" },
        { code: "BR", label: "브라질" },
        { code: "AR", label: "아르헨티나" },
        { code: "CL", label: "칠레" },
        { code: "ZA", label: "남아프리카공화국" },
        { code: "EG", label: "이집트" },
    ], []);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (missing_email && !currentEmail) {
            alert("이메일을 입력해주세요.");
            return;
        }

        if (missing_nationality && !currentNationality) {
            alert("국적을 선택해주세요.");
            return;
        }

        router.post("/auth/social/complete-profile", {
            email: currentEmail,
            nationality: currentNationality,
        }, {
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                if (firstError) {
                    alert(firstError as string);
                }
            },
        });
    };

    const providerName = provider === "kakao"
        ? "카카오"
        : provider === "google"
            ? "구글"
            : provider === "facebook"
                ? "페이스북"
                : "소셜";

    return (
        <>
            <Head title="추가 정보 입력" />
            <div className="flex justify-center pt-8">
                <form onSubmit={handleSubmit} className="w-[400px] p-5">
                    <div className="space-y-2 text-center pb-5">
                        <p className="text-xl text-gray-950 dark:text-white font-semibold">추가 정보 입력</p>
                        <p className="text-xs text-gray-500">{providerName} 계정에서 제공되지 않은 정보만 입력해주세요.</p>
                    </div>

                    {missing_email && (
                        <FormInput
                            autoFocus={true}
                            label="이메일"
                            id="email"
                            name="email"
                            type="email"
                            value={currentEmail}
                            onChange={(e) => setCurrentEmail(e.target.value)}
                        />
                    )}

                    {missing_nationality && (
                        <div className="w-full">
                            <label htmlFor="nationality" className="form-label">국적</label>
                            <select
                                id="nationality"
                                name="nationality"
                                value={currentNationality}
                                onChange={(e) => setCurrentNationality(e.target.value)}
                                className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-gray-100"
                            >
                                <option value="">국적을 선택해주세요</option>
                                {nationalityOptions.map((option) => (
                                    <option key={option.code} value={option.code}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn w-full main-btn my-3">
                        저장 후 계속
                    </button>
                </form>
            </div>
        </>
    );
}
