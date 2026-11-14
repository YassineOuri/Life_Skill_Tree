<?php

namespace Database\Factories;

use App\Enums\NodeStatus;
use App\Models\Category;
use App\Models\SkillNode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SkillNode>
 */
class SkillNodeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'title' => fake()->words(3, true),
            'status' => NodeStatus::Available,
            'position' => 0,
        ];
    }

    /**
     * The node requires the given prerequisites (same category as the first one).
     */
    public function requires(SkillNode ...$prerequisites): static
    {
        return $this
            ->state(fn () => ['category_id' => $prerequisites[0]->category_id])
            ->afterCreating(fn (SkillNode $node) => $node->prerequisites()->attach(
                array_map(fn (SkillNode $p) => $p->id, $prerequisites)
            ));
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => NodeStatus::Completed,
            'completed_at' => now(),
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn () => ['status' => NodeStatus::InProgress]);
    }
}
