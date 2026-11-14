<?php

namespace App\Http\Controllers;

use App\Enums\NodeStatus;
use App\Models\QuestStep;
use App\Models\SkillNode;
use App\Support\Progression;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ChronicleController extends Controller
{
    public function index(): Response
    {
        $completed = SkillNode::with('category')
            ->where('status', NodeStatus::Completed)
            ->whereNotNull('completed_at')
            ->orderBy('completed_at')
            ->orderBy('id')
            ->get();

        $events = collect()
            ->concat($this->completionAndLevelUps($completed))
            ->concat($this->doneSteps())
            // Newest first; on the same moment a level-up is shown above the completion that caused it.
            ->sortBy([['date', 'desc'], ['order', 'desc']])
            ->map(fn (array $event) => collect($event)->except('order')->all())
            ->values();

        return Inertia::render('Chronicle/Index', [
            'character' => Progression::forXp(Progression::earnedXp($completed)),
            'events' => $events,
            'upcoming' => $this->upcoming(),
        ]);
    }

    /** Open skills with a target date, soonest (and overdue) first. */
    private function upcoming(): Collection
    {
        $today = today();

        return SkillNode::with('category')
            ->where('status', '!=', NodeStatus::Completed)
            ->whereNotNull('target_date')
            ->orderBy('target_date')
            ->orderBy('id')
            ->get()
            ->map(fn (SkillNode $node) => [
                'id' => $node->id,
                'title' => $node->title,
                'target_date' => $node->target_date->format('Y-m-d'),
                'overdue' => $node->target_date->lt($today),
                'category' => $this->category($node),
            ]);
    }

    /**
     * Replays completions in date order so each level-up lands on the day it was reached.
     */
    private function completionAndLevelUps(Collection $completed): Collection
    {
        $events = collect();
        $xp = 0;
        $level = 1;
        $sequence = 0;

        foreach ($completed as $node) {
            $date = $node->completed_at->toIso8601String();
            $events->push([
                'type' => 'skill_completed',
                'date' => $date,
                'order' => $sequence++,
                'title' => $node->title,
                'category' => $this->category($node),
                'rarity' => $node->rarity->value,
                'xp' => $node->xp(),
            ]);

            $xp += $node->xp();
            $reached = Progression::forXp($xp)['level'];
            while ($level < $reached) {
                $events->push([
                    'type' => 'level_up',
                    'date' => $date,
                    'order' => $sequence++,
                    'title' => 'Level '.++$level,
                    'level' => $level,
                ]);
            }
        }

        return $events;
    }

    private function doneSteps(): Collection
    {
        return QuestStep::with('node.category')
            ->whereNotNull('done_at')
            ->get()
            ->map(fn (QuestStep $step) => [
                'type' => 'step_done',
                'date' => $step->done_at->toIso8601String(),
                'order' => 0,
                'title' => $step->title,
                'skill_title' => $step->node->title,
                'category' => $this->category($step->node),
            ]);
    }

    private function category(SkillNode $node): array
    {
        return $node->category->only(['name', 'color', 'icon']);
    }
}
