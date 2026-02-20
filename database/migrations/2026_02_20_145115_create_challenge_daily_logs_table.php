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
        Schema::create('challenge_daily_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('challenge_id')
                ->constrained('challenges')
                ->cascadeOnDelete();

            // 하루 단위 로그(회고) 날짜
            $table->date('log_date');

            // 회고/기록
            $table->text('review_text')->nullable();

            // (선택) 난이도/컨디션 점수 등
            $table->unsignedTinyInteger('difficulty_score')->nullable();

            $table->timestamps();

            // 동일 챌린지에서 같은 날짜 로그는 1개만
            $table->unique(['challenge_id', 'log_date']);

            $table->index(['challenge_id', 'log_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenge_daily_logs');
    }
};
