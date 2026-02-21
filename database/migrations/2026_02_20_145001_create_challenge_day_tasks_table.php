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
        Schema::create('challenge_day_tasks', function (Blueprint $table) {
            $table->id();

            // 어떤 챌린지에 속하는지
            $table->foreignId('challenge_id')
                ->constrained('challenges')
                ->cascadeOnDelete();

            // 몇 일차인지 (1~N)
            $table->unsignedTinyInteger('day_number');

            // 하루 안에서의 순서 (1~3)
            $table->unsignedTinyInteger('task_order');

            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_required')->default(true);

            // 체크 여부
            $table->boolean('is_done')->default(false);

            // 완료 시간
            $table->dateTime('done_at')->nullable();

            $table->timestamps();

            // 동일 챌린지, 동일 day, 동일 순서는 중복 불가
            $table->unique(['challenge_id', 'day_number', 'task_order']);

            $table->index(['challenge_id', 'day_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenge_day_tasks');
    }
};
