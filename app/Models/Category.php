<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'color', 'icon', 'position'];

    protected static function booted(): void
    {
        // Delete skills one by one so their evidence files are removed from disk too.
        static::deleting(fn (Category $category) => $category->nodes->each->delete());
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(SkillNode::class);
    }
}
