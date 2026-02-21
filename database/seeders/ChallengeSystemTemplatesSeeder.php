<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChallengeSystemTemplatesSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $templates = [
                [
                    'title' => '아침 루틴 정착 7일',
                    'description' => '무리 없이 하루를 시작하기 위한 기본 아침 습관을 만듭니다.',
                    'icon' => '🌅',
                    'category' => 'routine',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '기상 후 물 1컵 마시기', 'description' => null, 'is_required' => true],
                            ['title' => '오늘 일정 1개 확인', 'description' => null, 'is_required' => false],
                        ],
                        2 => [
                            ['title' => '가벼운 스트레칭 5분', 'description' => null, 'is_required' => true],
                            ['title' => '아침 식사 또는 간단한 간식 챙기기', 'description' => null, 'is_required' => false],
                        ],
                        3 => [
                            ['title' => '기상 시간 기록하기', 'description' => null, 'is_required' => true],
                            ['title' => '햇빛 3분 쬐기', 'description' => null, 'is_required' => false],
                        ],
                        4 => [
                            ['title' => '핸드폰 확인 전 할 일 1개 완료', 'description' => null, 'is_required' => true],
                            ['title' => '오늘 우선순위 1개 메모', 'description' => null, 'is_required' => true],
                        ],
                        5 => [
                            ['title' => '자리 정돈 3분', 'description' => null, 'is_required' => true],
                            ['title' => '심호흡 1분', 'description' => null, 'is_required' => false],
                        ],
                        6 => [
                            ['title' => '어제보다 5분 일찍 시작하기', 'description' => null, 'is_required' => true],
                            ['title' => '컨디션 점수 1~5 기록', 'description' => null, 'is_required' => false],
                        ],
                        7 => [
                            ['title' => '가장 유지하기 쉬운 루틴 2개 선택', 'description' => null, 'is_required' => true],
                            ['title' => '다음 주 계획에 반영', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
                [
                    'title' => '영어 회화 기초 7일',
                    'description' => '짧은 말하기 연습으로 회화 습관을 만드는 학습 챌린지입니다.',
                    'icon' => '🗣️',
                    'category' => 'study',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '자기소개 5문장 말하기', 'description' => null, 'is_required' => true],
                            ['title' => '새 표현 2개 기록', 'description' => null, 'is_required' => true],
                        ],
                        2 => [
                            ['title' => '오늘 한 일 1분 말하기', 'description' => null, 'is_required' => true],
                            ['title' => '발음 어려운 단어 3개 반복', 'description' => null, 'is_required' => false],
                        ],
                        3 => [
                            ['title' => '좋아하는 주제 1분 말하기', 'description' => null, 'is_required' => true],
                            ['title' => '문법 오류 1개 수정', 'description' => null, 'is_required' => false],
                        ],
                        4 => [
                            ['title' => '짧은 영상 보고 핵심 3문장 요약', 'description' => null, 'is_required' => true],
                            ['title' => '요약문 소리 내어 읽기', 'description' => null, 'is_required' => true],
                        ],
                        5 => [
                            ['title' => '질문 문장 3개 만들기', 'description' => null, 'is_required' => true],
                            ['title' => '답변 문장 3개 만들기', 'description' => null, 'is_required' => false],
                        ],
                        6 => [
                            ['title' => '1분 자유 말하기 녹음', 'description' => null, 'is_required' => true],
                            ['title' => '개선 포인트 1개 메모', 'description' => null, 'is_required' => true],
                        ],
                        7 => [
                            ['title' => '이번 주 표현 10개 복습', 'description' => null, 'is_required' => true],
                            ['title' => '다음 주 학습 목표 1개 설정', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
                [
                    'title' => '기초 홈트 7일',
                    'description' => '짧고 안정적인 운동 루틴으로 체력 기반을 만듭니다.',
                    'icon' => '💪',
                    'category' => 'workout',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '전신 스트레칭 5분', 'description' => null, 'is_required' => true],
                            ['title' => '스쿼트 15회', 'description' => null, 'is_required' => true],
                        ],
                        2 => [
                            ['title' => '플랭크 20초 x 2세트', 'description' => null, 'is_required' => true],
                            ['title' => '가벼운 걷기 10분', 'description' => null, 'is_required' => false],
                        ],
                        3 => [
                            ['title' => '푸쉬업 8회 x 2세트', 'description' => '무릎 푸쉬업 가능', 'is_required' => true],
                            ['title' => '어깨 스트레칭 3분', 'description' => null, 'is_required' => false],
                        ],
                        4 => [
                            ['title' => '런지 좌우 각 10회', 'description' => null, 'is_required' => true],
                            ['title' => '코어 운동 3분', 'description' => null, 'is_required' => false],
                        ],
                        5 => [
                            ['title' => '유산소 10분', 'description' => '걷기 또는 제자리 운동', 'is_required' => true],
                            ['title' => '운동 후 물 섭취', 'description' => null, 'is_required' => true],
                        ],
                        6 => [
                            ['title' => '전신 순환 운동 8분', 'description' => null, 'is_required' => true],
                            ['title' => '근육 피로도 1~5 기록', 'description' => null, 'is_required' => false],
                        ],
                        7 => [
                            ['title' => '이번 주 운동 루틴 복습', 'description' => null, 'is_required' => true],
                            ['title' => '다음 주 계획 2회분 설정', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
                [
                    'title' => '정리 습관 만들기 7일',
                    'description' => '작은 정리 행동을 반복해 생활 환경을 안정적으로 유지합니다.',
                    'icon' => '🧹',
                    'category' => 'routine',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '책상 위 10분 정리', 'description' => null, 'is_required' => true],
                            ['title' => '불필요한 물건 3개 분리', 'description' => null, 'is_required' => true],
                        ],
                        2 => [
                            ['title' => '가방/파우치 정리 10분', 'description' => null, 'is_required' => true],
                            ['title' => '중복 물품 체크', 'description' => null, 'is_required' => false],
                        ],
                        3 => [
                            ['title' => '옷장 한 구역 정리', 'description' => null, 'is_required' => true],
                            ['title' => '보관/폐기 기준 정하기', 'description' => null, 'is_required' => false],
                        ],
                        4 => [
                            ['title' => '침실 주변 정돈 10분', 'description' => null, 'is_required' => true],
                            ['title' => '자주 쓰는 물건 위치 고정', 'description' => null, 'is_required' => true],
                        ],
                        5 => [
                            ['title' => '디지털 파일 10분 정리', 'description' => null, 'is_required' => true],
                            ['title' => '중복 사진/파일 10개 삭제', 'description' => null, 'is_required' => false],
                        ],
                        6 => [
                            ['title' => '주방/서랍 한 칸 정리', 'description' => null, 'is_required' => true],
                            ['title' => '필요 물품 메모', 'description' => null, 'is_required' => false],
                        ],
                        7 => [
                            ['title' => '유지할 정리 규칙 2개 정하기', 'description' => null, 'is_required' => true],
                            ['title' => '주간 정리 시간 예약', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
                [
                    'title' => '지출 점검 7일',
                    'description' => '일일 지출 기록으로 소비 패턴을 파악하고 절약 습관을 만듭니다.',
                    'icon' => '💸',
                    'category' => 'custom',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '오늘 지출 전부 기록', 'description' => null, 'is_required' => true],
                            ['title' => '필수/비필수 분류', 'description' => null, 'is_required' => true],
                        ],
                        2 => [
                            ['title' => '소비 항목 상위 3개 확인', 'description' => null, 'is_required' => true],
                            ['title' => '절감 가능 항목 1개 선정', 'description' => null, 'is_required' => false],
                        ],
                        3 => [
                            ['title' => '구독 서비스 1개 점검', 'description' => null, 'is_required' => true],
                            ['title' => '해지 또는 유지 결정 메모', 'description' => null, 'is_required' => false],
                        ],
                        4 => [
                            ['title' => '식비 절약 실천 1회', 'description' => null, 'is_required' => true],
                            ['title' => '절약 금액 기록', 'description' => null, 'is_required' => false],
                        ],
                        5 => [
                            ['title' => '하루 예산 상한 설정', 'description' => null, 'is_required' => true],
                            ['title' => '예산 준수 여부 체크', 'description' => null, 'is_required' => true],
                        ],
                        6 => [
                            ['title' => '대체 소비 방법 1개 찾기', 'description' => null, 'is_required' => true],
                            ['title' => '내일 소비 계획 간단 작성', 'description' => null, 'is_required' => false],
                        ],
                        7 => [
                            ['title' => '7일 총지출 요약', 'description' => null, 'is_required' => true],
                            ['title' => '다음 주 목표 금액 설정', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
                [
                    'title' => '콘텐츠 작성 루틴 7일',
                    'description' => '짧은 분량을 매일 작성해 꾸준한 제작 습관을 형성합니다.',
                    'icon' => '✍️',
                    'category' => 'custom',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '주제 3개 정리', 'description' => null, 'is_required' => true],
                            ['title' => '우선 주제 1개 선정', 'description' => null, 'is_required' => true],
                        ],
                        2 => [
                            ['title' => '개요 5줄 작성', 'description' => null, 'is_required' => true],
                            ['title' => '참고 자료 2개 수집', 'description' => null, 'is_required' => false],
                        ],
                        3 => [
                            ['title' => '초안 20분 작성', 'description' => null, 'is_required' => true],
                            ['title' => '제목 후보 3개 작성', 'description' => null, 'is_required' => false],
                        ],
                        4 => [
                            ['title' => '문장 다듬기 15분', 'description' => null, 'is_required' => true],
                            ['title' => '중복 표현 정리', 'description' => null, 'is_required' => true],
                        ],
                        5 => [
                            ['title' => '최종본 1개 완료', 'description' => null, 'is_required' => true],
                            ['title' => '공개/보관 방식 선택', 'description' => null, 'is_required' => false],
                        ],
                        6 => [
                            ['title' => '피드백 확인 후 1개 수정', 'description' => null, 'is_required' => true],
                            ['title' => '다음 글 주제 메모', 'description' => null, 'is_required' => false],
                        ],
                        7 => [
                            ['title' => '이번 주 작성량 요약', 'description' => null, 'is_required' => true],
                            ['title' => '다음 주 작성 일정 2회 설정', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
                [
                    'title' => '수면 루틴 안정화 7일',
                    'description' => '취침과 기상 시간을 일정하게 맞추는 수면 관리 챌린지입니다.',
                    'icon' => '😴',
                    'category' => 'routine',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '취침 목표 시간 설정', 'description' => null, 'is_required' => true],
                            ['title' => '기상 목표 시간 설정', 'description' => null, 'is_required' => true],
                        ],
                        2 => [
                            ['title' => '취침 1시간 전 화면 사용 줄이기', 'description' => null, 'is_required' => true],
                            ['title' => '카페인 섭취 시간 기록', 'description' => null, 'is_required' => false],
                        ],
                        3 => [
                            ['title' => '취침 전 스트레칭 5분', 'description' => null, 'is_required' => true],
                            ['title' => '내일 할 일 3개 정리', 'description' => null, 'is_required' => false],
                        ],
                        4 => [
                            ['title' => '침실 환경 점검', 'description' => '조명, 소음, 온도', 'is_required' => true],
                            ['title' => '개선 항목 1개 적용', 'description' => null, 'is_required' => true],
                        ],
                        5 => [
                            ['title' => '기상 후 햇빛 5분', 'description' => null, 'is_required' => true],
                            ['title' => '오전 컨디션 점수 기록', 'description' => null, 'is_required' => false],
                        ],
                        6 => [
                            ['title' => '취침 전 루틴 2개 반복', 'description' => null, 'is_required' => true],
                            ['title' => '수면 시간 기록', 'description' => null, 'is_required' => true],
                        ],
                        7 => [
                            ['title' => '일주일 수면 패턴 요약', 'description' => null, 'is_required' => true],
                            ['title' => '유지 규칙 2개 결정', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
                [
                    'title' => '집밥 기초 7일',
                    'description' => '간단한 조리 습관으로 식사 준비의 부담을 줄입니다.',
                    'icon' => '🍳',
                    'category' => 'custom',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '간단한 한 끼 만들기', 'description' => null, 'is_required' => true],
                            ['title' => '조리 시간 기록', 'description' => null, 'is_required' => false],
                        ],
                        2 => [
                            ['title' => '냉장고 재료 확인 후 메뉴 결정', 'description' => null, 'is_required' => true],
                            ['title' => '부족 재료 목록 작성', 'description' => null, 'is_required' => true],
                        ],
                        3 => [
                            ['title' => '칼질/손질 10분 연습', 'description' => null, 'is_required' => true],
                            ['title' => '정리까지 마무리하기', 'description' => null, 'is_required' => false],
                        ],
                        4 => [
                            ['title' => '국 또는 볶음 1개 조리', 'description' => null, 'is_required' => true],
                            ['title' => '간 조절 메모', 'description' => null, 'is_required' => true],
                        ],
                        5 => [
                            ['title' => '다음 날 식사 일부 미리 준비', 'description' => null, 'is_required' => true],
                            ['title' => '보관 용기 정리', 'description' => null, 'is_required' => false],
                        ],
                        6 => [
                            ['title' => '새 재료 1개 사용해보기', 'description' => null, 'is_required' => true],
                            ['title' => '만족도 기록', 'description' => null, 'is_required' => false],
                        ],
                        7 => [
                            ['title' => '자주 할 수 있는 메뉴 3개 정리', 'description' => null, 'is_required' => true],
                            ['title' => '주간 장보기 기준 작성', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
                [
                    'title' => '대화 습관 개선 7일',
                    'description' => '무리 없는 소통 실천으로 관계에서의 기본 대화력을 높입니다.',
                    'icon' => '💬',
                    'category' => 'custom',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '하루 1회 먼저 인사하기', 'description' => null, 'is_required' => true],
                            ['title' => '대화 후 느낀 점 1줄', 'description' => null, 'is_required' => false],
                        ],
                        2 => [
                            ['title' => '질문 1개로 대화 시작하기', 'description' => null, 'is_required' => true],
                            ['title' => '상대 답변 요약해 되묻기', 'description' => null, 'is_required' => false],
                        ],
                        3 => [
                            ['title' => '경청 5분 실천', 'description' => '중간 끊기 없이 듣기', 'is_required' => true],
                            ['title' => '핵심 키워드 2개 기록', 'description' => null, 'is_required' => true],
                        ],
                        4 => [
                            ['title' => '감사 표현 1회 전달', 'description' => null, 'is_required' => true],
                            ['title' => '칭찬 표현 1회 전달', 'description' => null, 'is_required' => false],
                        ],
                        5 => [
                            ['title' => '안부 메시지 1개 보내기', 'description' => null, 'is_required' => true],
                            ['title' => '답장 타이밍 점검', 'description' => null, 'is_required' => false],
                        ],
                        6 => [
                            ['title' => '짧은 대화 1회 이어가기', 'description' => null, 'is_required' => true],
                            ['title' => '대화 만족도 1~5 기록', 'description' => null, 'is_required' => true],
                        ],
                        7 => [
                            ['title' => '일주일 대화 회고 작성', 'description' => null, 'is_required' => true],
                            ['title' => '다음 주 실천 항목 2개 선정', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
                [
                    'title' => '업무 효율 정리 7일',
                    'description' => '작은 실행 단위로 업무 흐름을 정돈하고 집중 시간을 확보합니다.',
                    'icon' => '📌',
                    'category' => 'study',
                    'duration_days' => 7,
                    'visibility' => 'public',
                    'days' => [
                        1 => [
                            ['title' => '오늘 핵심 업무 3개 정하기', 'description' => null, 'is_required' => true],
                            ['title' => '우선순위 순서 배치', 'description' => null, 'is_required' => true],
                        ],
                        2 => [
                            ['title' => '집중 시간 25분 2회 실행', 'description' => null, 'is_required' => true],
                            ['title' => '방해 요인 1개 차단', 'description' => null, 'is_required' => false],
                        ],
                        3 => [
                            ['title' => '반복 업무 1개 템플릿화', 'description' => null, 'is_required' => true],
                            ['title' => '절약 시간 기록', 'description' => null, 'is_required' => false],
                        ],
                        4 => [
                            ['title' => '회의/메모 정리 15분', 'description' => null, 'is_required' => true],
                            ['title' => '후속 액션 3개 정의', 'description' => null, 'is_required' => true],
                        ],
                        5 => [
                            ['title' => '마감 전 점검 목록 사용', 'description' => null, 'is_required' => true],
                            ['title' => '실수/누락 1개 개선', 'description' => null, 'is_required' => false],
                        ],
                        6 => [
                            ['title' => '중요 업무 먼저 완료', 'description' => null, 'is_required' => true],
                            ['title' => '완료 기준 문장화', 'description' => null, 'is_required' => true],
                        ],
                        7 => [
                            ['title' => '주간 성과 요약 5줄', 'description' => null, 'is_required' => true],
                            ['title' => '다음 주 개선점 2개 확정', 'description' => null, 'is_required' => true],
                        ],
                    ],
                ],
            ];

            foreach ($templates as $tpl) {
                $template = DB::table('challenge_templates')->where([
                    'is_system' => 1,
                    'title' => $tpl['title'],
                ])->first();

                if (!$template) {
                    $templateId = DB::table('challenge_templates')->insertGetId([
                        'uuid' => (string) Str::uuid(),
                        'owner_id' => null,
                        'title' => $tpl['title'],
                        'description' => $tpl['description'],
                        'icon' => $tpl['icon'],
                        'category' => $tpl['category'],
                        'duration_days' => $tpl['duration_days'],
                        'visibility' => $tpl['visibility'],
                        'is_system' => true,
                        'is_active' => true,
                        'usage_count' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $templateId = $template->id;

                    DB::table('challenge_templates')
                        ->where('id', $templateId)
                        ->update([
                            'description' => $tpl['description'],
                            'icon' => $tpl['icon'],
                            'category' => $tpl['category'],
                            'duration_days' => $tpl['duration_days'],
                            'visibility' => $tpl['visibility'],
                            'updated_at' => now(),
                        ]);
                }

                DB::table('challenge_template_days')
                    ->where('template_id', $templateId)
                    ->delete();

                foreach ($tpl['days'] as $dayNumber => $tasks) {
                    $order = 1;
                    foreach ($tasks as $task) {
                        DB::table('challenge_template_days')->insert([
                            'template_id' => $templateId,
                            'day_number' => $dayNumber,
                            'task_order' => $order,
                            'title' => $task['title'],
                            'description' => $task['description'],
                            'is_required' => $task['is_required'],
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $order++;
                    }
                }
            }
        });
    }
}
