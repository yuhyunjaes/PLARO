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
            $table->foreignId('chat_id')->nullable()->constrained('chat_messages')->onDelete('cascade');
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->string('title')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->enum('type', ['normal', 'challenge', 'dday'])->default('normal');
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->longText('description')->nullable();
            $table->string('color');
            $table->index(['start_at', 'end_at']);
            $table->index('type');
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
