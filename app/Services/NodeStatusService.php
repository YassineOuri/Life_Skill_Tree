<?php

namespace App\Services;

use App\Enums\NodeStatus;
use App\Models\SkillNode;
use Illuminate\Validation\ValidationException;

class NodeStatusService
{
    /**
     * Move a node to a new status, enforcing the unlock rules.
     *
     * @throws ValidationException
     */
    public function transition(SkillNode $node, NodeStatus $status): SkillNode
    {
        if ($node->locked) {
            throw ValidationException::withMessages([
                'status' => 'This skill is locked: complete all its prerequisites first.',
            ]);
        }

        $leavingCompleted = $node->status === NodeStatus::Completed && $status !== NodeStatus::Completed;

        if ($leavingCompleted && $node->dependents()->where('status', '!=', NodeStatus::Available)->exists()) {
            throw ValidationException::withMessages([
                'status' => 'Cannot un-complete this skill while skills that require it are in progress or completed.',
            ]);
        }

        $node->status = $status;
        $node->completed_at = $status === NodeStatus::Completed ? ($node->completed_at ?? now()) : null;
        $node->save();

        return $node;
    }
}
