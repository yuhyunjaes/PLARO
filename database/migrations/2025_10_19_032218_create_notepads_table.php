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
        Schema::create('notepads', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid');
            $table->foreignId('chat_id')->nullable()->constrained('chat_messages')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title')->nullable();
            $table->longText('content')->nullable();
            $table->string('category')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notepads');
    }
};
