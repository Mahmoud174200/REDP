<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->auditAction('CREATE');
        });

        static::updated(function ($model) {
            $model->auditAction('UPDATE');
        });

        static::deleted(function ($model) {
            $model->auditAction('DELETE');
        });
    }

    protected function auditAction(string $action): void
    {
        if ($this instanceof AuditLog) {
            return;
        }

        $userId = Auth::id();
        $ip = Request::ip();
        $userAgent = Request::header('User-Agent');
        $sessionId = request()->hasSession() ? request()->session()->getId() : null;

        // Basic User Agent Parsing
        $browser = 'Unknown';
        $deviceType = 'Desktop';

        if ($userAgent) {
            if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $userAgent)) {
                $deviceType = 'Tablet';
            } elseif (preg_match('/(mobi|opera mini|nokia|sony|ericsson|mot|blackberry|samsung|htc|lg|nexus|pixel|iphone)/i', $userAgent)) {
                $deviceType = 'Mobile';
            }

            if (str_contains($userAgent, 'MSIE') || str_contains($userAgent, 'Trident')) {
                $browser = 'Internet Explorer';
            } elseif (str_contains($userAgent, 'Firefox')) {
                $browser = 'Firefox';
            } elseif (str_contains($userAgent, 'Chrome')) {
                $browser = 'Chrome';
            } elseif (str_contains($userAgent, 'Safari')) {
                $browser = 'Safari';
            } elseif (str_contains($userAgent, 'Opera') || str_contains($userAgent, 'OPR')) {
                $browser = 'Opera';
            }
        }

        // Mock Geo Location for development
        $geoLocation = [
            'lat' => 30.0444,
            'lng' => 31.2357,
            'city' => 'Cairo',
            'country' => 'Egypt'
        ];

        $oldValues = null;
        $newValues = null;

        if ($action === 'CREATE') {
            $newValues = $this->getAttributes();
            unset($newValues['password'], $newValues['remember_token']);
        } elseif ($action === 'UPDATE') {
            $dirty = $this->getDirty();
            $oldValues = [];
            $newValues = [];
            foreach ($dirty as $key => $value) {
                if (in_array($key, ['password', 'remember_token', 'updated_at'])) {
                    continue;
                }
                $oldValues[$key] = $this->getOriginal($key);
                $newValues[$key] = $value;
            }
            if (empty($newValues)) {
                return;
            }
        } elseif ($action === 'DELETE') {
            $oldValues = $this->getAttributes();
            unset($oldValues['password'], $oldValues['remember_token']);
        }

        AuditLog::create([
            'user_id' => $userId,
            'action' => strtoupper(class_basename($this)) . '_' . $action,
            'entity_type' => get_class($this),
            'entity_id' => $this->id,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'device_type' => $deviceType,
            'browser' => $browser,
            'geo_location' => $geoLocation,
            'session_id' => $sessionId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'details' => [
                'entity' => class_basename($this),
                'action' => $action,
                'message' => class_basename($this) . " was " . strtolower($action) . "d."
            ]
        ]);
    }
}
