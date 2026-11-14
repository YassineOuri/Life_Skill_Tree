<?php

namespace Tests\Feature;

use App\Models\SkillNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SkillTreeIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_categories_and_nodes_with_locked_flag(): void
    {
        $root = SkillNode::factory()->create();
        $child = SkillNode::factory()->requires($root)->create();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('SkillTree/Index', false)
                ->has('categories', 1)
                ->has('nodes', 2)
                ->where('nodes.0.id', $root->id)
                ->where('nodes.0.locked', false)
                ->where('nodes.1.id', $child->id)
                ->where('nodes.1.locked', true)
            );
    }

    public function test_child_of_completed_parent_is_unlocked(): void
    {
        $root = SkillNode::factory()->completed()->create();
        SkillNode::factory()->requires($root)->create();

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->component('SkillTree/Index', false)
            ->where('nodes.1.locked', false)
        );
    }
}
