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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('chat_id')
                ->nullable()
                ->constrained('chat_messages')
                ->onDelete('cascade');

            $table->foreignId('creator_id')
                ->constrained('users')
                ->onDelete('cascade');

            // 챌린지 연결
            $table->foreignId('challenge_id')
                ->nullable()
                ->constrained('challenges')
                ->cascadeOnDelete();
            $table->foreignId('dday_id')
                ->nullable()
                ->constrained('ddays')
                ->cascadeOnDelete();

            $table->string('title')->nullable();

            $table->dateTime('start_at');
            $table->dateTime('end_at');

            $table->enum('type', ['normal', 'challenge', 'dday'])
                ->default('normal')
                ->index();

            $table->enum('status', ['active', 'completed', 'cancelled'])
                ->default('active')
                ->index();

            $table->longText('description')->nullable();

            $table->string('color')->nullable(); // 챌린지면 challenges.color 복사 가능

            $table->index(['start_at', 'end_at']);
            $table->index(['creator_id', 'type', 'start_at']);
            $table->unique(['challenge_id']);
            $table->unique(['dday_id']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
