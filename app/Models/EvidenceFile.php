<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/** A certificate or proof file stored on the private local disk. */
class EvidenceFile extends Model
{
    public const DISK = 'local';

    protected $fillable = ['skill_node_id', 'original_name', 'path', 'mime', 'size'];

    protected static function booted(): void
    {
        static::deleting(fn (EvidenceFile $file) => Storage::disk(self::DISK)->delete($file->path));
    }

    public function node(): BelongsTo
    {
        return $this->belongsTo(SkillNode::class, 'skill_node_id');
    }

    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->original_name,
            'mime' => $this->mime,
            'size' => $this->size,
            'url' => route('files.show', $this, false),
            'download_url' => route('files.download', $this, false),
        ];
    }
}
