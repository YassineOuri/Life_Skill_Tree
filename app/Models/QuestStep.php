<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestStep extends Model
{
    use HasFactory;

    protected $fillable = ['skill_node_id', 'title', 'done_at', 'position'];

    protected function casts(): array
    {
        return ['done_at' => 'datetime'];
    }

    public function node(): BelongsTo
    {
        return $this->belongsTo(SkillNode::class, 'skill_node_id');
    }
}
