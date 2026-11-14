<?php

namespace App\Http\Controllers;

use App\Enums\NodeStatus;
use App\Http\Requests\QuestStepRequest;
use App\Models\QuestStep;
use App\Models\SkillNode;
use App\Services\NodeStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class QuestStepController extends Controller
{
    public function store(QuestStepRequest $request, SkillNode $node): RedirectResponse
    {
        $this->ensureUnlocked($node);

        $node->steps()->create($request->validated() + ['position' => $node->steps()->count()]);

        return back();
    }

    public function update(QuestStepRequest $request, QuestStep $step): RedirectResponse
    {
        $step->update($request->validated());

        return back();
    }

    /**
     * Check or uncheck a step. The first check on an available skill starts training it;
     * finishing every step never completes the skill on its own.
     */
    public function toggle(QuestStep $step, NodeStatusService $service): RedirectResponse
    {
        $node = $step->node;
        $this->ensureUnlocked($node);

        $step->update(['done_at' => $step->done_at ? null : now()]);

        if ($step->done_at && $node->status === NodeStatus::Available) {
            $service->transition($node, NodeStatus::InProgress);
        }

        return back();
    }

    public function destroy(QuestStep $step): RedirectResponse
    {
        $step->delete();

        return back();
    }

    private function ensureUnlocked(SkillNode $node): void
    {
        if ($node->locked) {
            throw ValidationException::withMessages([
                'steps' => 'This skill is locked: complete all its prerequisites first.',
            ]);
        }
    }
}
