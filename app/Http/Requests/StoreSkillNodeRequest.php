<?php

namespace App\Http\Requests;

use App\Enums\Rarity;
use App\Models\SkillNode;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSkillNodeRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'prerequisite_ids' => ['nullable', 'array', $this->prerequisitesRule()],
            'prerequisite_ids.*' => ['integer', 'distinct', 'exists:skill_nodes,id'],
            // Existing skills that will require the new one (adding a "leaf" under them).
            'dependent_ids' => ['nullable', 'array', $this->dependentsRule()],
            'dependent_ids.*' => ['integer', 'distinct', 'exists:skill_nodes,id'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'icon' => ['nullable', 'string', 'max:50'],
            'rarity' => ['nullable', Rule::enum(Rarity::class)],
            'target_date' => ['nullable', 'date'],
            'evidence_url' => ['nullable', 'url', 'max:2048'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Prerequisites may come from any category. A brand-new skill cannot close a cycle,
     * so only updates add a check (see UpdateSkillNodeRequest).
     */
    protected function prerequisitesRule(): Closure
    {
        return fn (string $attribute, mixed $value, Closure $fail) => null;
    }

    /**
     * The new skill would sit between its prerequisites and its dependents: a prerequisite that
     * is (or already requires) one of those dependents would close a cycle.
     */
    protected function dependentsRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            $dependents = SkillNode::whereIn('id', (array) $value)->get();

            foreach (SkillNode::whereIn('id', (array) $this->input('prerequisite_ids', []))->get() as $prerequisite) {
                foreach ($dependents as $dependent) {
                    if ($prerequisite->dependsOn($dependent)) {
                        $fail("“{$prerequisite->title}” already depends on “{$dependent->title}”, so it cannot be a prerequisite of a skill “{$dependent->title}” requires.");

                        return;
                    }
                }
            }
        };
    }
}
