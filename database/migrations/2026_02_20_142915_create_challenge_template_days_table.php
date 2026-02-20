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
        Schema::create('challenge_template_days', function (Blueprint $table) {
            $table->id();

            $table->foreignId('template_id')
                ->constrained('challenge_templates')
                ->cascadeOnDelete();

            // Day 1 ~ N (보통 7일)
            $table->unsignedTinyInteger('day_number');

            // 하루에 1~3개 미션 순서
            $table->unsignedTinyInteger('task_order');

            $table->string('title');
            $table->text('description')->nullable();

            // 필수 미션 여부 (완료 판정에 사용)
            $table->boolean('is_required')->default(true);

            $table->timestamps();

            // 한 템플릿의 특정 Day에서 task_order는 유일해야 함
            $table->unique(['template_id', 'day_number', 'task_order']);

            // 조회 최적화
            $table->index(['template_id', 'day_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenge_template_days');
    }
};
