<?php

namespace App\Traits;

use App\Services\AuditLogService;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function (Model $model) {
            static::logModelChange('CREATED', $model, null, $model->getAttributes());
        });

        static::updating(function (Model $model) {
            $dirty = $model->getDirty();
            $old = [];
            $new = [];

            foreach ($dirty as $key => $newValue) {
                // Skip timestamp fields to keep logs clean unless requested
                if (in_array($key, ['updated_at', 'created_at'])) {
                    continue;
                }
                $old[$key] = $model->getOriginal($key);
                $new[$key] = $newValue;
            }

            if (!empty($new)) {
                static::logModelChange('UPDATED', $model, $old, $new);
            }
        });

        static::deleted(function (Model $model) {
            static::logModelChange('DELETED', $model, $model->getAttributes(), null);
        });
    }

    protected static function logModelChange(string $action, Model $model, ?array $old, ?array $new)
    {
        $userId = auth()->id() ?: null;
        $entityType = get_class($model);
        $entityId = (string) $model->getKey();

        $baseName = strtoupper(class_basename($model));
        $fullAction = "{$baseName}_{$action}";

        $details = [
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ];

        AuditLogService::log($fullAction, $userId, $details, $old, $new);
    }
}
