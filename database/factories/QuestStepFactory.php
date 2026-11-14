<?php

namespace Database\Factories;

use App\Models\SkillNode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestStep>
 */
class QuestStepFactory extends Factory
{
    public function definition(): array
    {
        return [
            'skill_node_id' => SkillNode::factory(),
            'title' => fake()->sentence(3),
            'position' => 0,
        ];
    }
}
