<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ddays', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('title')->nullable();

            $table->enum('status', ['active', 'completed', 'cancelled'])
                ->default('active')
                ->index();

            $table->date('start_date');
            $table->date('target_date');
            $table->unsignedSmallInteger('duration_days')->default(1);
            $table->unsignedSmallInteger('current_day')->default(1);
            $table->unsignedInteger('streak_count')->default(0);
            $table->unsignedTinyInteger('achievement_rate')->default(0);
            $table->date('last_check_date')->nullable();
            $table->unsignedInteger('restart_count')->default(0);
            $table->string('color')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status', 'start_date', 'target_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ddays');
    }
};

