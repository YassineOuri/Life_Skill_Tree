<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\SkillNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_can_be_created(): void
    {
        $this->post('/categories', ['name' => 'Career', 'color' => '#38bdf8', 'icon' => 'briefcase'])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('categories', ['name' => 'Career', 'color' => '#38bdf8']);
    }

    public function test_category_requires_name_and_valid_color(): void
    {
        $this->post('/categories', ['name' => '', 'color' => 'blue'])
            ->assertSessionHasErrors(['name', 'color']);
    }

    public function test_category_can_be_updated(): void
    {
        $category = Category::factory()->create();

        $this->put("/categories/{$category->id}", ['name' => 'Health', 'color' => '#22c55e'])
            ->assertSessionHasNoErrors();

        $this->assertSame('Health', $category->fresh()->name);
    }

    public function test_deleting_category_deletes_its_nodes(): void
    {
        $node = SkillNode::factory()->create();
        $child = SkillNode::factory()->requires($node)->create();

        $this->delete("/categories/{$node->category_id}")->assertRedirect();

        $this->assertDatabaseMissing('categories', ['id' => $node->category_id]);
        $this->assertDatabaseMissing('skill_nodes', ['id' => $node->id]);
        $this->assertDatabaseMissing('skill_nodes', ['id' => $child->id]);
    }
}
