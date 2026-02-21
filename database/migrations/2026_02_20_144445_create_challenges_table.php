<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('challenges', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            // 소유자
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // 템플릿 기반이면 연결, 사용자 직접 생성이면 null
            $table->foreignId('template_id')
                ->nullable()
                ->constrained('challenge_templates')
                ->nullOnDelete();

            // 실행 시점 스냅샷(템플릿 변경과 독립)
            $table->string('title');

            // template/custom
            $table->enum('mode', ['template', 'custom'])->default('template')->index();

            // active/paused/completed/cancelled
            $table->enum('status', ['active', 'paused', 'completed', 'cancelled'])
                ->default('active')
                ->index();

            $table->date('start_date');
            $table->date('end_date')->nullable();

            // 캐시/요약 값 (대시보드, 빠른 표시용)
            $table->unsignedTinyInteger('current_day')->default(1);      // 1~N
            $table->unsignedInteger('streak_count')->default(0);         // 연속 완료
            $table->unsignedTinyInteger('achievement_rate')->default(0); // 0~100

            $table->date('last_check_date')->nullable();  // 마지막 완료(또는 체크)한 날짜
            $table->unsignedInteger('restart_count')->default(0);

            // 간단 버전: 최근 회고 1개만 저장 (누적은 challenge_daily_logs로)
            $table->text('review')->nullable();
            $table->longText('ai_summary')->nullable();

            // (선택) 챌린지 색상: 템플릿/인스턴스 단위로 컬러를 고정하고 싶다면
            $table->string('color')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status', 'start_date']);
            $table->index(['template_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenges');
    }
};
