<?php

namespace App\Library;

use App\Models\Category;
use App\Models\QuestStep;
use App\Models\SkillNode;

/**
 * Serialises the whole tree to the backup format (version 1).
 * Skills reference their prerequisites by `ref`, which is unique across the file,
 * so links between categories survive an import. Evidence files are listed by name only.
 */
class TreeExporter
{
    public const VERSION = 1;

    public function export(): array
    {
        $categories = Category::with(['nodes' => fn ($q) => $q->orderBy('position')->orderBy('id'), 'nodes.prerequisites:id', 'nodes.steps', 'nodes.files'])
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return [
            'version' => self::VERSION,
            'exported_at' => now()->toIso8601String(),
            'categories' => $categories->map(fn (Category $category) => [
                'name' => $category->name,
                'color' => $category->color,
                'icon' => $category->icon,
                'skills' => $category->nodes->map(fn (SkillNode $node) => [
                    'ref' => self::ref($node->id),
                    'title' => $node->title,
                    'description' => $node->description,
                    'icon' => $node->icon,
                    'rarity' => $node->rarity->value,
                    'status' => $node->status->value,
                    'target_date' => $node->target_date?->format('Y-m-d'),
                    'completed_at' => $node->completed_at?->toIso8601String(),
                    'evidence_url' => $node->evidence_url,
                    'prerequisites' => $node->prerequisites->map(fn (SkillNode $p) => self::ref($p->id))->all(),
                    'steps' => $node->steps->map(fn (QuestStep $step) => [
                        'title' => $step->title,
                        'done_at' => $step->done_at?->toIso8601String(),
                    ])->all(),
                    'files' => $node->files->pluck('original_name')->all(),
                ])->all(),
            ])->all(),
        ];
    }

    private static function ref(int $id): string
    {
        return "s{$id}";
    }
}
