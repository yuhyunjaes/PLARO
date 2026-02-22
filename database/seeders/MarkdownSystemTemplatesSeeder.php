<?php

namespace Database\Seeders;

use App\Models\MarkdownTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MarkdownSystemTemplatesSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()->firstOrCreate(
            ['email' => 'system-markdown@plaro.local'],
            [
                'user_id' => 'system_markdown',
                'name' => 'Markdown System',
                'password' => bcrypt(Str::random(32)),
            ]
        );

        $templates = [
            ['title' => '주간 일정 정리', 'description' => '한 주 일정을 보기 좋게 정리하는 기본 템플릿', 'template_text' => "## 이번 주 일정\n- 월요일:\n- 화요일:\n- 수요일:\n- 목요일:\n- 금요일:\n\n## 핵심 할 일\n- [ ]"],
            ['title' => '회의 기록', 'description' => '회의 안건/결론/액션아이템 정리', 'template_text' => "## 회의 정보\n- 일시:\n- 참석자:\n\n## 안건\n1. \n\n## 결론\n- \n\n## 액션 아이템\n- [ ] 담당자 / 마감일"],
            ['title' => '일일 회고', 'description' => '오늘 한 일과 개선점을 남기는 템플릿', 'template_text' => "## 오늘 한 일\n- \n\n## 좋았던 점\n- \n\n## 아쉬웠던 점\n- \n\n## 내일 할 일\n- [ ]"],
            ['title' => '프로젝트 계획', 'description' => '목표, 범위, 일정, 리스크를 빠르게 작성', 'template_text' => "## 목표\n\n## 범위\n- 포함:\n- 제외:\n\n## 일정\n| 단계 | 기간 | 비고 |\n| --- | --- | --- |\n| 기획 |  |  |\n\n## 리스크\n- "],
            ['title' => '학습 노트', 'description' => '학습 내용 요약과 복습 포인트 기록', 'template_text' => "## 학습 주제\n\n## 핵심 개념\n- \n\n## 예시\n```txt\n\n```\n\n## 복습 체크\n- [ ]"],
            ['title' => '여행 체크리스트', 'description' => '준비물과 일정 메모를 함께 작성', 'template_text' => "## 여행 정보\n- 기간:\n- 장소:\n\n## 준비물\n- [ ] 여권/신분증\n- [ ] 충전기\n\n## 일정 메모\n- "],
            ['title' => '가계부 메모', 'description' => '지출 내역과 메모를 표로 정리', 'template_text' => "## 이번 달 지출\n| 항목 | 금액 | 메모 |\n| --- | --- | --- |\n| 식비 |  |  |\n| 교통 |  |  |\n\n## 절약 아이디어\n- "],
            ['title' => '콘텐츠 초안', 'description' => '글/영상/게시물 초안 작성용', 'template_text' => "## 제목 후보\n1. \n2. \n\n## 훅 문장\n\n## 본문 구조\n- 도입:\n- 전개:\n- 마무리:\n\n## CTA\n"],
            ['title' => '업무 인수인계', 'description' => '업무 상태와 다음 액션 공유용', 'template_text' => "## 업무 개요\n\n## 현재 상태\n- 진행률:\n- 이슈:\n\n## 다음 담당자 할 일\n- [ ]\n\n## 참고 링크\n- "],
            ['title' => '아이디어 정리', 'description' => '떠오른 아이디어를 구조화해 저장', 'template_text' => "## 아이디어 한 줄\n\n## 문제 정의\n\n## 해결 방식\n\n## 기대 효과\n- \n\n## 다음 액션\n- [ ]"],
        ];

        foreach ($templates as $template) {
            MarkdownTemplate::query()->updateOrCreate(
                [
                    'owner_id' => $owner->id,
                    'title' => $template['title'],
                ],
                [
                    'uuid' => (string) Str::uuid(),
                    'description' => $template['description'],
                    'template_text' => $template['template_text'],
                    'visibility' => 'public',
                    'is_active' => true,
                ]
            );
        }
    }
}
