<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileUploadService
{
    /**
     * Upload an asset and return its reference URL/path.
     *
     * Defaults to the "public" disk (storage/app/public, symlinked to
     * public/storage) so the returned /storage/... URL is web-servable —
     * required for anything rendered in the UI (photos, images). Pass
     * $disk = 'local' for private assets (documents) streamed through an
     * authenticated download endpoint instead.
     */
    public static function upload(UploadedFile $file, string $folder = 'documents', string $disk = 'public'): string
    {
        // Generates a unique secure hash filename
        $path = $file->store($folder, $disk);

        // Returns the reference URL/path for database persistence
        return Storage::disk($disk)->url($path);
    }
}
