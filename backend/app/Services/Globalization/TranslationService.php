<?php

namespace App\Services\Globalization;

use App\Models\Translation;

class TranslationService
{
    /**
     * Retrieve all key-value translation dictionaries for a locale.
     */
    public function getTranslationsForLocale(string $locale): array
    {
        // 1. Check if we need to seed default translation items for testing
        if (Translation::where('locale', $locale)->count() === 0) {
            $this->seedDefaultTranslations($locale);
        }

        $records = Translation::where('locale', $locale)->get();
        
        $dictionary = [];
        foreach ($records as $r) {
            if (!isset($dictionary[$r->group])) {
                $dictionary[$r->group] = [];
            }
            $dictionary[$r->group][$r->key] = $r->value;
        }

        return $dictionary;
    }

    /**
     * Create or edit a dynamic translation row.
     */
    public function updateOrCreateTranslation(array $data): Translation
    {
        return Translation::updateOrCreate(
            [
                'locale' => $data['locale'],
                'group' => $data['group'],
                'key' => $data['key']
            ],
            [
                'value' => $data['value']
            ]
        );
    }

    /**
     * Seeds base key dictionary for testing language settings.
     */
    protected function seedDefaultTranslations(string $locale)
    {
        $defaults = [
            'en' => [
                'ui' => [
                    'welcome' => 'Welcome back to REDP Portal',
                    'login' => 'Log In',
                    'dashboard' => 'Dashboard Overview',
                    'save' => 'Save Changes',
                    'cancel' => 'Cancel'
                ]
            ],
            'ar' => [
                'ui' => [
                    'welcome' => 'مرحباً بك مجدداً في نظام REDP',
                    'login' => 'تسجيل الدخول',
                    'dashboard' => 'لوحة التحكم العامة',
                    'save' => 'حفظ التعديلات',
                    'cancel' => 'إلغاء'
                ]
            ]
        ];

        $terms = $defaults[$locale] ?? $defaults['en'];

        foreach ($terms as $group => $keys) {
            foreach ($keys as $key => $val) {
                Translation::create([
                    'locale' => $locale,
                    'group' => $group,
                    'key' => $key,
                    'value' => $val
                ]);
            }
        }
    }
}
