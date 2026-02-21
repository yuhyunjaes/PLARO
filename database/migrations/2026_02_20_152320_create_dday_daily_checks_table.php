<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dday_daily_checks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('dday_id')
                ->constrained('ddays')
                ->cascadeOnDelete();

            $table->date('check_date');
            $table->boolean('is_done')->default(false);
            $table->dateTime('checked_at')->nullable();

            $table->timestamps();

            $table->unique(['dday_id', 'check_date']);
            $table->index(['dday_id', 'check_date', 'is_done']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dday_daily_checks');
    }
};

