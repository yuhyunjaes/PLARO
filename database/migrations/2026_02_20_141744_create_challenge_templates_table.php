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
            // unlisted  : 링크로만 접근 가능

            // 🔹 시스템 템플릿 여부
            $table->boolean('is_system')->default(false)->index();

            // 🔹 관리자 비활성화용
            $table->boolean('is_active')->default(true)->index();

            // 🔹 사용 횟수 (추천/정렬용 최소 통계)
            $table->unsignedInteger('usage_count')->default(0);

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
