<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectAmenity extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'name',
        'name_ar',
        'type',
        'area',
        'quantity',
        'description',
    ];

    protected $casts = [
        'area' => 'decimal:2',
    ];

    // ── Relationships ──

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // ── Type Labels (Arabic) ──

    public static function typeLabels(): array
    {
        return [
            'swimming_pool'   => 'حمام سباحة',
            'gym'             => 'نادي رياضي',
            'garden'          => 'حديقة',
            'playground'      => 'ملعب أطفال',
            'mosque'          => 'مسجد',
            'commercial_area' => 'منطقة تجارية',
            'security_room'   => 'غرفة حراسة',
            'clubhouse'       => 'كلوب هاوس',
            'walking_track'   => 'مسار مشي',
            'parking_lot'     => 'مواقف سيارات',
            'water_feature'   => 'نافورة / بحيرة',
            'sports_court'    => 'ملعب رياضي',
            'barbecue_area'   => 'منطقة شواء',
            'kids_area'       => 'منطقة ألعاب أطفال',
            'generator_room'  => 'غرفة مولدات',
            'water_tanks'     => 'خزانات مياه',
            'electrical_room' => 'غرفة كهرباء',
            'guard_house'     => 'بوابة حراسة',
            'other'           => 'أخرى',
        ];
    }

    /**
     * Get the Arabic label for this amenity type.
     */
    public function getTypeLabelAttribute(): string
    {
        return static::typeLabels()[$this->type] ?? $this->type;
    }
}
