<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LifeBotController extends Controller
{
    private function callGemini(string $model, array $parts, array $generationConfig): \Illuminate\Http\JsonResponse
    {
        $apiKey = env('GEMINI_API_KEY');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'GEMINI_API_KEY is not configured.',
            ], 500);
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/{$model}:generateContent?key={$apiKey}";

        try {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->timeout(45)
                ->post($url, [
                    'contents' => [[
                        'parts' => $parts,
                    ]],
                    'generationConfig' => $generationConfig,
                ]);

            if (!$response->successful()) {
                Log::warning('Gemini request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Gemini request failed.',
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Throwable $e) {
            Log::error('Gemini internal error', ['msg' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gemini internal error.',
            ], 500);
        }
    }

    public function title(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate([
            'model_name' => ['nullable', 'string', 'max:100'],
            'prompt' => ['required', 'string'],
        ]);

        $model = $data['model_name'] ?? 'models/gemini-2.5-flash';
        $prompt = $data['prompt'];

        return $this->callGemini(
            model: $model,
            parts: [['text' => $prompt]],
            generationConfig: [
                'temperature' => 0.7,
                'maxOutputTokens' => 2048,
            ]
        );
    }

    public function chat(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate([
            'model_name' => ['nullable', 'string', 'max:100'],
            'parts' => ['required', 'array', 'min:1'],
            'parts.*.text' => ['required', 'string'],
            'generationConfig' => ['nullable', 'array'],
        ]);

        $model = $data['model_name'] ?? 'models/gemini-2.5-flash';
        $parts = $data['parts'];
        $generationConfig = $data['generationConfig'] ?? [
            'temperature' => 0.8,
            'maxOutputTokens' => 5120,
        ];

        return $this->callGemini(
            model: $model,
            parts: $parts,
            generationConfig: $generationConfig
        );
    }
}
