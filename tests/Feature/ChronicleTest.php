<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\QuestStep;
use App\Models\SkillNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ChronicleTest extends TestCase
{
    use RefreshDatabase;

    public function test_chronicle_lists_completions_steps_and_level_ups_newest_first(): void
    {
        $career = Category::factory()->create(['name' => 'Career', 'color' => '#38bdf8', 'icon' => 'briefcase']);
        SkillNode::factory()->completed()->create([
            'category_id' => $career->id, 'title' => 'AWS CP', 'rarity' => 'rare', 'completed_at' => '2025-01-10 10:00:00',
        ]);
        $saa = SkillNode::factory()->completed()->create([
            'category_id' => $career->id, 'title' => 'AWS SAA', 'rarity' => 'epic', 'completed_at' => '2025-03-01 10:00:00',
        ]);
        QuestStep::factory()->for($saa, 'node')->create(['title' => 'Practice exam', 'done_at' => '2025-02-01 10:00:00']);
        QuestStep::factory()->for($saa, 'node')->create(['title' => 'Not done yet']);
        SkillNode::factory()->create(['category_id' => $career->id, 'title' => 'Unfinished']);

        $this->get('/chronicle')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Chronicle/Index', false)
                ->where('character.level', 2)
                ->has('events', 4)
                ->where('events.0.type', 'level_up')
                ->where('events.0.level', 2)
                ->where('events.1.type', 'skill_completed')
                ->where('events.1.title', 'AWS SAA')
                ->where('events.1.xp', 50)
                ->where('events.1.rarity', 'epic')
                ->where('events.1.category.name', 'Career')
                ->where('events.2.type', 'step_done')
                ->where('events.2.title', 'Practice exam')
                ->where('events.2.skill_title', 'AWS SAA')
                ->where('events.3.type', 'skill_completed')
                ->where('events.3.title', 'AWS CP')
            );
    }

    public function test_a_big_completion_can_grant_several_levels(): void
    {
        SkillNode::factory()->completed()->create(['rarity' => 'legendary', 'completed_at' => '2025-05-05 10:00:00']);
        SkillNode::factory()->completed()->create(['rarity' => 'legendary', 'completed_at' => '2025-06-06 10:00:00']);

        // 100 XP → level 2, then 200 XP → level 3 (no level 4 until 300).
        $this->get('/chronicle')->assertInertia(fn (Assert $page) => $page
            ->component('Chronicle/Index', false)
            ->where('events.0.type', 'level_up')
            ->where('events.0.level', 3)
            ->where('events.2.type', 'level_up')
            ->where('events.2.level', 2)
        );
    }

    public function test_upcoming_lists_open_targets_soonest_first_with_overdue_flag(): void
    {
        $category = Category::factory()->create(['name' => 'Career']);
        $later = SkillNode::factory()->create(['category_id' => $category->id, 'title' => 'Later', 'target_date' => now()->addMonths(2)]);
        $overdue = SkillNode::factory()->inProgress()->create(['category_id' => $category->id, 'title' => 'Late', 'target_date' => now()->subDays(3)]);
        $soon = SkillNode::factory()->create(['category_id' => $category->id, 'title' => 'Soon', 'target_date' => now()->addDays(5)]);
        SkillNode::factory()->completed()->create(['category_id' => $category->id, 'target_date' => now()->addDays(1)]);
        SkillNode::factory()->create(['category_id' => $category->id, 'target_date' => null]);

        $this->get('/chronicle')->assertInertia(fn (Assert $page) => $page
            ->component('Chronicle/Index', false)
            ->has('upcoming', 3)
            ->where('upcoming.0.id', $overdue->id)
            ->where('upcoming.0.overdue', true)
            ->where('upcoming.1.id', $soon->id)
            ->where('upcoming.1.overdue', false)
            ->where('upcoming.1.target_date', $soon->target_date->format('Y-m-d'))
            ->where('upcoming.1.category.name', 'Career')
            ->where('upcoming.2.id', $later->id)
        );
    }

    public function test_empty_chronicle(): void
    {
        $this->get('/chronicle')->assertInertia(fn (Assert $page) => $page
            ->component('Chronicle/Index', false)
            ->has('events', 0)
            ->where('character.level', 1)
        );
    }
}
