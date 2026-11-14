<?php

namespace App\Http\Requests;

use App\Models\SkillNode;
use Closure;

class UpdateSkillNodeRequest extends StoreSkillNodeRequest
{
    public function rules(): array
    {
        return parent::rules() + [
            // Backdating a completion; ignored unless the skill is completed.
            'completed_at' => ['nullable', 'date', 'before_or_equal:today'],
        ];
    }

    /** Rejects prerequisites that would close a cycle (across categories too). */
    protected function prerequisitesRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            $node = $this->route('node');

            foreach (SkillNode::whereIn('id', (array) $value)->get() as $prerequisite) {
                if ($prerequisite->dependsOn($node)) {
                    $fail("“{$prerequisite->title}” already depends on this skill, so it cannot be a prerequisite.");

                    return;
                }
            }
        };
    }
}
