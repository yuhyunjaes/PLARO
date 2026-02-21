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
        Schema::create('challenge_templates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            // 🔹 소유자 (시스템 템플릿이면 null)
            $table->foreignId('owner_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // 🔹 기본 정보
            $table->string('title');
            $table->text('description')->nullable();

            // 🔹 아이콘 (이모지 또는 아이콘 키)
            // 예: 🌅 🎤 🏋️ 또는 'sunrise', 'mic', 'dumbbell'
            $table->string('icon', 32)->nullable();

            // 🔹 카테고리
            $table->enum('category', ['routine', 'study', 'workout', 'custom'])
                ->default('custom')
                ->index();

            // 🔹 기본 기간
            $table->unsignedTinyInteger('duration_days')->default(7);

            // 🔹 공개 범위
            $table->enum('visibility', ['private', 'public', 'unlisted'])
                ->default('private')
                ->index();
            // private   : 나만 사용
            // public    : 검색/목록 노출
            // unlisted  : 링크 공유 전용

            // 🔹 시스템 템플릿 여부
            $table->boolean('is_system')->default(false)->index();

            // 🔹 관리자 비활성화용
            $table->boolean('is_active')->default(true)->index();

            // 🔹 통계
            $table->unsignedInteger('usage_count')->default(0);
            $table->unsignedInteger('like_count')->default(0);

            $table->timestamps();

            $table->index(['visibility', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenge_templates');
    }
};
