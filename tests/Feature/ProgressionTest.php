<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\SkillNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProgressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_sends_character_and_category_progression(): void
    {
        $career = Category::factory()->create();
        SkillNode::factory()->completed()->create(['category_id' => $career->id, 'rarity' => 'rare']);
        SkillNode::factory()->completed()->create(['category_id' => $career->id, 'rarity' => 'epic']);
        SkillNode::factory()->create(['category_id' => $career->id, 'rarity' => 'legendary']);
        $health = Category::factory()->create();
        SkillNode::factory()->completed()->create(['category_id' => $health->id]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->component('SkillTree/Index', false)
            ->where('character', ['level' => 2, 'xp' => 85, 'floor' => 50, 'next' => 150])
            ->where('categories.0.level', 2)
            ->where('categories.0.xp', 75)
            ->where('categories.1.level', 1)
            ->where('categories.1.xp', 10)
            ->where('nodes.0.rarity', 'rare')
            ->where('nodes.0.xp', 25)
            ->where('nodes.2.xp', 100)
        );
    }

    public function test_rarity_defaults_to_common(): void
    {
        $category = Category::factory()->create();

        $this->post('/nodes', ['category_id' => $category->id, 'title' => 'X'])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('skill_nodes', ['title' => 'X', 'rarity' => 'common']);
    }

    public function test_invalid_rarity_is_rejected(): void
    {
        $category = Category::factory()->create();

        $this->post('/nodes', ['category_id' => $category->id, 'title' => 'X', 'rarity' => 'mythic'])
            ->assertSessionHasErrors('rarity');
    }

    public function test_completed_date_can_be_backdated(): void
    {
        $node = SkillNode::factory()->completed()->create();

        $this->put("/nodes/{$node->id}", [
            'category_id' => $node->category_id,
            'title' => $node->title,
            'completed_at' => '2024-01-15',
        ])->assertSessionHasNoErrors();

        $this->assertSame('2024-01-15', $node->fresh()->completed_at->format('Y-m-d'));
    }

    public function test_completed_date_cannot_be_in_the_future(): void
    {
        $node = SkillNode::factory()->completed()->create();

        $this->put("/nodes/{$node->id}", [
            'category_id' => $node->category_id,
            'title' => $node->title,
            'completed_at' => now()->addDays(3)->format('Y-m-d'),
        ])->assertSessionHasErrors('completed_at');
    }

    public function test_completed_date_is_ignored_for_unfinished_skills(): void
    {
        $node = SkillNode::factory()->create();

        $this->put("/nodes/{$node->id}", [
            'category_id' => $node->category_id,
            'title' => $node->title,
            'completed_at' => '2024-01-15',
        ])->assertSessionHasNoErrors();

        $this->assertNull($node->fresh()->completed_at);
    }
}
