<?php

namespace App\Http\Controllers;

use App\Library\TemplateLibrary;
use App\Models\Category;
use App\Models\SkillNode;
use App\Support\Progression;
use Inertia\Inertia;
use Inertia\Response;

class SkillTreeController extends Controller
{
    public function index(TemplateLibrary $templates): Response
    {
        $nodes = SkillNode::with(['prerequisites:id,status', 'steps', 'files'])
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        $categories = Category::orderBy('position')->orderBy('id')
            ->get(['id', 'name', 'color', 'icon', 'position'])
            ->map(fn (Category $category) => $category->only(['id', 'name', 'color', 'icon', 'position'])
                + Progression::forXp(Progression::earnedXp($nodes->where('category_id', $category->id))));

        return Inertia::render('SkillTree/Index', [
            'character' => Progression::forXp(Progression::earnedXp($nodes)),
            'templates' => $templates->summaries(),
            'categories' => $categories,
            'nodes' => $nodes->map(fn (SkillNode $node) => [
                'id' => $node->id,
                'category_id' => $node->category_id,
                'prerequisite_ids' => $node->prerequisites->pluck('id')->all(),
                'title' => $node->title,
                'description' => $node->description,
                'icon' => $node->icon,
                'rarity' => $node->rarity->value,
                'xp' => $node->xp(),
                'status' => $node->status->value,
                'locked' => $node->locked,
                'target_date' => $node->target_date?->format('Y-m-d'),
                'completed_at' => $node->completed_at?->toIso8601String(),
                'evidence_url' => $node->evidence_url,
                'position' => $node->position,
                'steps' => $node->steps->map(fn ($step) => [
                    'id' => $step->id,
                    'title' => $step->title,
                    'done_at' => $step->done_at?->toIso8601String(),
                    'position' => $step->position,
                ])->all(),
                'files' => $node->files->map->toPayload()->all(),
            ]),
        ]);
    }
}
