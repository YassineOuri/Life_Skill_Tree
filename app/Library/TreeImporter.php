<?php

namespace App\Library;

use App\Enums\NodeStatus;
use App\Enums\Rarity;
use App\Models\Category;
use App\Models\SkillNode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Creates skills from a backup (TreeExporter format) or a template.
 * Everything is validated first and written in one transaction, so a bad file changes nothing.
 * Errors are reported on the `file` field.
 */
class TreeImporter
{
    /**
     * Import a backup as new categories (existing data is never touched).
     *
     * @return int number of skills created
     *
     * @throws ValidationException
     */
    public function importBackup(string $json): int
    {
        $data = json_decode($json, true);
        if (! is_array($data)) {
            $this->fail('The file is not valid JSON.');
        }

        $validator = Validator::make($data, $this->rules());
        if ($validator->fails()) {
            $this->fail('Invalid backup: '.$validator->errors()->first());
        }

        $this->assertGraph(array_merge(...array_map(fn ($c) => $c['skills'], $data['categories'])));

        return DB::transaction(function () use ($data) {
            $refs = [];
            $links = [];
            $position = (Category::max('position') ?? -1) + 1;

            foreach ($data['categories'] as $source) {
                $category = Category::create([
                    'name' => $this->freeName($source['name']),
                    'color' => $source['color'],
                    'icon' => $source['icon'] ?? null,
                    'position' => $position++,
                ]);
                $this->createSkills($category, $source['skills'], true, $refs, $links);
            }

            $this->link($refs, $links);

            return count($refs);
        });
    }

    /**
     * Add a template's skills to a category: everything starts available, with no dates or progress.
     *
     * @return int number of skills created
     */
    public function applyTemplate(array $template, Category $category): int
    {
        $this->assertGraph($template['skills']);

        return DB::transaction(function () use ($template, $category) {
            $refs = [];
            $links = [];
            $this->createSkills($category, $template['skills'], false, $refs, $links);
            $this->link($refs, $links);

            return count($refs);
        });
    }

    private function rules(): array
    {
        $skill = 'categories.*.skills.*.';

        return [
            'version' => ['required', Rule::in([TreeExporter::VERSION])],
            'categories' => ['required', 'array'],
            'categories.*.name' => ['required', 'string', 'max:100'],
            'categories.*.color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'categories.*.icon' => ['nullable', 'string', 'max:50'],
            'categories.*.skills' => ['present', 'array'],
            $skill.'ref' => ['required', 'string', 'max:100'],
            $skill.'title' => ['required', 'string', 'max:150'],
            $skill.'description' => ['nullable', 'string', 'max:5000'],
            $skill.'icon' => ['nullable', 'string', 'max:50'],
            $skill.'rarity' => ['nullable', Rule::enum(Rarity::class)],
            $skill.'status' => ['nullable', Rule::enum(NodeStatus::class)],
            $skill.'target_date' => ['nullable', 'date'],
            $skill.'completed_at' => ['nullable', 'date'],
            $skill.'evidence_url' => ['nullable', 'string', 'max:2048'],
            $skill.'prerequisites' => ['nullable', 'array'],
            $skill.'prerequisites.*' => ['string'],
            $skill.'steps' => ['nullable', 'array'],
            $skill.'steps.*.title' => ['required', 'string', 'max:150'],
            $skill.'steps.*.done_at' => ['nullable', 'date'],
        ];
    }

    /** Refs must be unique, prerequisites must point to known refs, and there must be no cycle. */
    private function assertGraph(array $skills): void
    {
        $graph = [];
        foreach ($skills as $skill) {
            if (isset($graph[$skill['ref']])) {
                $this->fail("Duplicate skill ref “{$skill['ref']}”.");
            }
            $graph[$skill['ref']] = $skill['prerequisites'] ?? [];
        }

        foreach ($graph as $ref => $prerequisites) {
            foreach ($prerequisites as $prerequisite) {
                if (! isset($graph[$prerequisite])) {
                    $this->fail("Skill “{$ref}” requires unknown skill “{$prerequisite}”.");
                }
            }
        }

        // Depth-first search: reaching a node that is still on the stack means a cycle.
        $state = [];
        $visit = function (string $ref) use (&$visit, &$state, $graph) {
            if (($state[$ref] ?? null) === 'done') {
                return;
            }
            if (($state[$ref] ?? null) === 'visiting') {
                $this->fail("Prerequisites form a cycle around “{$ref}”.");
            }
            $state[$ref] = 'visiting';
            foreach ($graph[$ref] as $prerequisite) {
                $visit($prerequisite);
            }
            $state[$ref] = 'done';
        };
        foreach (array_keys($graph) as $ref) {
            $visit((string) $ref);
        }
    }

    private function createSkills(Category $category, array $skills, bool $keepProgress, array &$refs, array &$links): void
    {
        $position = $category->nodes()->count();

        foreach ($skills as $skill) {
            $status = $keepProgress ? ($skill['status'] ?? NodeStatus::Available->value) : NodeStatus::Available->value;
            $completed = $status === NodeStatus::Completed->value;

            $node = $category->nodes()->create([
                'title' => $skill['title'],
                'description' => $skill['description'] ?? null,
                'icon' => $skill['icon'] ?? null,
                'rarity' => $skill['rarity'] ?? Rarity::Common->value,
                'status' => $status,
                'target_date' => $keepProgress ? ($skill['target_date'] ?? null) : null,
                'completed_at' => $completed ? ($skill['completed_at'] ?? now()) : null,
                'evidence_url' => $skill['evidence_url'] ?? null,
                'position' => $position++,
            ]);

            foreach ($skill['steps'] ?? [] as $i => $step) {
                // Templates list steps as plain titles; backups as {title, done_at}.
                $step = is_string($step) ? ['title' => $step] : $step;
                $node->steps()->create([
                    'title' => $step['title'],
                    'done_at' => $keepProgress ? ($step['done_at'] ?? null) : null,
                    'position' => $i,
                ]);
            }

            $refs[$skill['ref']] = $node->id;
            $links[$node->id] = $skill['prerequisites'] ?? [];
        }
    }

    private function link(array $refs, array $links): void
    {
        foreach ($links as $nodeId => $prerequisiteRefs) {
            if ($prerequisiteRefs) {
                SkillNode::find($nodeId)->prerequisites()->attach(array_map(fn ($ref) => $refs[$ref], $prerequisiteRefs));
            }
        }
    }

    /** "Career" → "Career (imported)" → "Career (imported 2)"… when the name is taken. */
    private function freeName(string $name): string
    {
        $candidate = $name;
        for ($i = 1; Category::where('name', $candidate)->exists(); $i++) {
            $candidate = $i === 1 ? "{$name} (imported)" : "{$name} (imported {$i})";
        }

        return $candidate;
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['file' => $message]);
    }
}
