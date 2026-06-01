<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileUploadService
{
    /**
     * Upload an asset to the designated storage disk.
     */
    public static function upload(UploadedFile $file, string $folder = 'documents'): string
    {
        $disk = env('FILESYSTEM_DISK', 'local');
        
        // Generates a unique secure hash filename
        $path = $file->store($folder, $disk);
        
        // Returns the reference URL/path for database persistence
        return Storage::disk($disk)->url($path);
    }
}
