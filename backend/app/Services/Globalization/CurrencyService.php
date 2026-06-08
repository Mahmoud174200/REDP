<?php

namespace App\Services\Globalization;

use App\Models\Currency;
use App\Models\ExchangeRate;
use Carbon\Carbon;

class CurrencyService
{
    /**
     * Convert an amount from one currency code to another.
     */
    public function convert(float $amount, string $fromCode, string $toCode): float
    {
        if ($fromCode === $toCode) {
            return $amount;
        }

        $from = Currency::where('code', strtoupper($fromCode))->first();
        $to = Currency::where('code', strtoupper($toCode))->first();

        if (!$from || !$to) {
            return $amount; // Default fallback if currency doesn't exist
        }

        // Try direct rate
        $rate = ExchangeRate::where('from_currency_id', $from->id)
            ->where('to_currency_id', $to->id)
            ->value('rate');

        if ($rate) {
            return $amount * (float)$rate;
        }

        // Try inverse rate
        $inverseRate = ExchangeRate::where('from_currency_id', $to->id)
            ->where('to_currency_id', $from->id)
            ->value('rate');

        if ($inverseRate && (float)$inverseRate > 0) {
            return $amount / (float)$inverseRate;
        }

        // Try conversion via USD as base base currency
        $base = Currency::where('code', 'USD')->first();
        if ($base) {
            $rateToUSD = ExchangeRate::where('from_currency_id', $from->id)->where('to_currency_id', $base->id)->value('rate');
            $usdToTarget = ExchangeRate::where('from_currency_id', $base->id)->where('to_currency_id', $to->id)->value('rate');
            if ($rateToUSD && $usdToTarget) {
                return $amount * (float)$rateToUSD * (float)$usdToTarget;
            }
        }

        return $amount;
    }

    /**
     * Seed or sync exchange rates with mock live indicators.
     */
    public function syncExchangeRates(): void
    {
        // 1. Ensure currencies exist
        $currencies = [
            'USD' => ['name' => 'United States Dollar', 'symbol' => '$'],
            'EGP' => ['name' => 'Egyptian Pound', 'symbol' => 'EGP'],
            'SAR' => ['name' => 'Saudi Riyal', 'symbol' => 'SR'],
            'AED' => ['name' => 'UAE Dirham', 'symbol' => 'AED']
        ];

        $currencyModels = [];
        foreach ($currencies as $code => $data) {
            $currencyModels[$code] = Currency::firstOrCreate(
                ['code' => $code],
                ['name' => $data['name'], 'symbol' => $data['symbol'], 'status' => 'active']
            );
        }

        // 2. Define rates relative to USD
        $ratesFromUSD = [
            'EGP' => 47.650000,
            'SAR' => 3.750000,
            'AED' => 3.670000,
        ];

        foreach ($ratesFromUSD as $code => $rateValue) {
            $target = $currencyModels[$code];
            $usd = $currencyModels['USD'];

            ExchangeRate::updateOrCreate(
                [
                    'from_currency_id' => $usd->id,
                    'to_currency_id' => $target->id
                ],
                [
                    'rate' => $rateValue,
                    'last_updated_at' => Carbon::now()
                ]
            );
        }
    }
}
