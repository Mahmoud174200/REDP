<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\Globalization\CurrencyService;
use App\Services\Globalization\TranslationService;
use App\Models\Currency;
use App\Models\ExchangeRate;
use App\Models\Translation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GlobalizationController extends Controller
{
    protected CurrencyService $currencyService;
    protected TranslationService $translationService;

    public function __construct(CurrencyService $currencyService, TranslationService $translationService)
    {
        $this->currencyService = $currencyService;
        $this->translationService = $translationService;
    }

    /**
     * Get active currencies.
     */
    public function getCurrencies(Request $request): JsonResponse
    {
        try {
            $currencies = Currency::all();
            return response()->json([
                'success' => true,
                'data' => $currencies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading currencies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active exchange rates.
     */
    public function getExchangeRates(Request $request): JsonResponse
    {
        try {
            $rates = ExchangeRate::with(['fromCurrency', 'toCurrency'])->get();
            return response()->json([
                'success' => true,
                'data' => $rates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading exchange rates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sync exchange rates.
     */
    public function syncExchangeRates(Request $request): JsonResponse
    {
        try {
            $this->currencyService->syncExchangeRates();
            $rates = ExchangeRate::with(['fromCurrency', 'toCurrency'])->get();
            return response()->json([
                'success' => true,
                'message' => 'Exchange rates synchronized successfully.',
                'data' => $rates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error syncing rates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get translation dictionary for a locale.
     */
    public function getTranslations(Request $request, string $locale): JsonResponse
    {
        try {
            $dictionary = $this->translationService->getTranslationsForLocale($locale);
            return response()->json([
                'success' => true,
                'data' => $dictionary
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading translations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save dynamic translation item.
     */
    public function saveTranslation(Request $request): JsonResponse
    {
        $request->validate([
            'locale' => 'required|string|max:10',
            'group' => 'required|string|max:50',
            'key' => 'required|string|max:100',
            'value' => 'required|string'
        ]);

        try {
            $translation = $this->translationService->updateOrCreateTranslation($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Translation item updated successfully.',
                'data' => $translation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error saving translation: ' . $e->getMessage()
            ], 500);
        }
    }
}
