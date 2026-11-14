<?php

namespace App\Models;

use App\Enums\NodeStatus;
use App\Enums\Rarity;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SkillNode extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 'title', 'description', 'icon', 'rarity',
        'status', 'target_date', 'completed_at', 'evidence_url', 'position',
    ];

    protected $appends = ['locked'];

    protected function casts(): array
    {
        return [
            'status' => NodeStatus::class,
            'rarity' => Rarity::class,
            'target_date' => 'date:Y-m-d',
            'completed_at' => 'datetime',
        ];
    }

    /** XP this skill is worth (granted once completed). */
    public function xp(): int
    {
        return ($this->rarity ?? Rarity::Common)->xp();
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    protected static function booted(): void
    {
        // Delete through Eloquent so each file also leaves the disk (a DB cascade would skip that).
        static::deleting(fn (SkillNode $node) => $node->files->each->delete());
    }

    /** Uploaded proof (certificates, screenshots). */
    public function files(): HasMany
    {
        return $this->hasMany(EvidenceFile::class)->orderBy('id');
    }

    /** Quest checklist, in display order. */
    public function steps(): HasMany
    {
        return $this->hasMany(QuestStep::class)->orderBy('position')->orderBy('id');
    }

    /** Skills that must be completed before this one unlocks. */
    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(SkillNode::class, 'skill_prerequisites', 'skill_node_id', 'prerequisite_id');
    }

    /** Skills that require this one. */
    public function dependents(): BelongsToMany
    {
        return $this->belongsToMany(SkillNode::class, 'skill_prerequisites', 'prerequisite_id', 'skill_node_id');
    }

    /**
     * Locked while any prerequisite is not completed. Skills without prerequisites are never locked.
     */
    protected function locked(): Attribute
    {
        return Attribute::get(fn () => $this->prerequisites
            ->contains(fn (SkillNode $p) => $p->status !== NodeStatus::Completed));
    }

    /**
     * Whether this node is $other or (transitively) requires it,
     * i.e. making $other depend on this node would create a cycle.
     */
    public function dependsOn(SkillNode $other): bool
    {
        $seen = [];
        $queue = [$this->id];

        while ($queue) {
            $id = array_shift($queue);
            if ($id === $other->id) {
                return true;
            }
            if (isset($seen[$id])) {
                continue;
            }
            $seen[$id] = true;
            array_push($queue, ...SkillNode::find($id)?->prerequisites()->pluck('skill_nodes.id')->all() ?? []);
        }

        return false;
    }
}
