<?php

namespace Tests\Feature;

use App\Enums\NodeStatus;
use App\Models\Category;
use App\Models\SkillNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SkillNodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_node_can_be_created(): void
    {
        $category = Category::factory()->create();

        $this->post('/nodes', [
            'category_id' => $category->id,
            'title' => 'Cloud Engineer',
            'icon' => 'cloud',
            'target_date' => '2027-06-01',
            'evidence_url' => 'https://example.com/cert',
        ])->assertSessionHasNoErrors();

        $node = SkillNode::firstWhere('title', 'Cloud Engineer');
        $this->assertSame(NodeStatus::Available, $node->status);
        $this->assertCount(0, $node->prerequisites);
    }

    public function test_node_can_be_created_with_several_prerequisites(): void
    {
        $docker = SkillNode::factory()->create();
        $linux = SkillNode::factory()->create(['category_id' => $docker->category_id]);

        $this->post('/nodes', [
            'category_id' => $docker->category_id,
            'prerequisite_ids' => [$docker->id, $linux->id],
            'title' => 'Kubernetes',
        ])->assertSessionHasNoErrors();

        $k8s = SkillNode::firstWhere('title', 'Kubernetes');
        $this->assertEqualsCanonicalizing([$docker->id, $linux->id], $k8s->prerequisites->pluck('id')->all());
    }

    public function test_node_is_locked_until_all_prerequisites_are_completed(): void
    {
        $docker = SkillNode::factory()->completed()->create();
        $linux = SkillNode::factory()->create(['category_id' => $docker->category_id]);
        $k8s = SkillNode::factory()->requires($docker, $linux)->create();

        $this->assertTrue($k8s->fresh()->locked);

        $linux->update(['status' => NodeStatus::Completed]);

        $this->assertFalse($k8s->fresh()->locked);
    }

    public function test_node_requires_title_and_category(): void
    {
        $this->post('/nodes', [])->assertSessionHasErrors(['title', 'category_id']);
    }

    public function test_evidence_url_must_be_a_url(): void
    {
        $category = Category::factory()->create();

        $this->post('/nodes', ['category_id' => $category->id, 'title' => 'X', 'evidence_url' => 'not a url'])
            ->assertSessionHasErrors('evidence_url');
    }

    public function test_prerequisite_can_come_from_another_category(): void
    {
        $english = SkillNode::factory()->create();
        $career = Category::factory()->create();

        $this->post('/nodes', ['category_id' => $career->id, 'prerequisite_ids' => [$english->id], 'title' => 'International job'])
            ->assertSessionHasNoErrors();

        $job = SkillNode::firstWhere('title', 'International job');
        $this->assertSame([$english->id], $job->prerequisites->pluck('id')->all());
        $this->assertTrue($job->locked);
    }

    public function test_cross_category_cycle_is_rejected(): void
    {
        $a = SkillNode::factory()->create();
        $b = SkillNode::factory()->create(); // another category
        $b->prerequisites()->attach($a);

        $this->put("/nodes/{$a->id}", ['category_id' => $a->category_id, 'prerequisite_ids' => [$b->id], 'title' => 'A'])
            ->assertSessionHasErrors('prerequisite_ids');
    }

    public function test_unknown_prerequisite_is_rejected(): void
    {
        $category = Category::factory()->create();

        $this->post('/nodes', ['category_id' => $category->id, 'prerequisite_ids' => [999], 'title' => 'X'])
            ->assertSessionHasErrors('prerequisite_ids.0');
    }

    public function test_node_can_be_updated(): void
    {
        $node = SkillNode::factory()->create();

        $this->put("/nodes/{$node->id}", [
            'category_id' => $node->category_id,
            'title' => 'Renamed',
            'description' => 'Desc',
        ])->assertSessionHasNoErrors();

        $this->assertSame('Renamed', $node->fresh()->title);
    }

    public function test_node_cannot_require_itself(): void
    {
        $node = SkillNode::factory()->create();

        $this->put("/nodes/{$node->id}", ['category_id' => $node->category_id, 'prerequisite_ids' => [$node->id], 'title' => 'X'])
            ->assertSessionHasErrors('prerequisite_ids');
    }

    public function test_node_cannot_require_one_of_its_dependents(): void
    {
        $a = SkillNode::factory()->create();
        $b = SkillNode::factory()->requires($a)->create();
        $c = SkillNode::factory()->requires($b)->create();

        $this->put("/nodes/{$a->id}", ['category_id' => $a->category_id, 'prerequisite_ids' => [$c->id], 'title' => 'X'])
            ->assertSessionHasErrors('prerequisite_ids');
    }

    public function test_removing_last_prerequisite_unlocks_node(): void
    {
        $prerequisite = SkillNode::factory()->create();
        $node = SkillNode::factory()->requires($prerequisite)->create();

        $this->put("/nodes/{$node->id}", ['category_id' => $node->category_id, 'prerequisite_ids' => [], 'title' => 'Solo'])
            ->assertSessionHasNoErrors();

        $this->assertFalse($node->fresh()->locked);
    }

    public function test_deleting_node_keeps_its_dependents(): void
    {
        $prerequisite = SkillNode::factory()->create();
        $dependent = SkillNode::factory()->requires($prerequisite)->create();

        $this->delete("/nodes/{$prerequisite->id}")->assertRedirect();

        $this->assertDatabaseMissing('skill_nodes', ['id' => $prerequisite->id]);
        $this->assertDatabaseHas('skill_nodes', ['id' => $dependent->id]);
        $this->assertDatabaseCount('skill_prerequisites', 0);
        $this->assertFalse($dependent->fresh()->locked);
    }

    public function test_status_transitions_set_and_clear_completed_at(): void
    {
        $node = SkillNode::factory()->create();

        $this->patch("/nodes/{$node->id}/status", ['status' => 'in_progress'])->assertSessionHasNoErrors();
        $this->assertSame(NodeStatus::InProgress, $node->fresh()->status);
        $this->assertNull($node->fresh()->completed_at);

        $this->patch("/nodes/{$node->id}/status", ['status' => 'completed'])->assertSessionHasNoErrors();
        $this->assertNotNull($node->fresh()->completed_at);

        $this->patch("/nodes/{$node->id}/status", ['status' => 'available'])->assertSessionHasNoErrors();
        $this->assertNull($node->fresh()->completed_at);
    }

    public function test_invalid_status_is_rejected(): void
    {
        $node = SkillNode::factory()->create();

        $this->patch("/nodes/{$node->id}/status", ['status' => 'locked'])->assertSessionHasErrors('status');
    }

    public function test_locked_node_status_cannot_change(): void
    {
        $prerequisite = SkillNode::factory()->create();
        $node = SkillNode::factory()->requires($prerequisite)->create();

        $this->patch("/nodes/{$node->id}/status", ['status' => 'in_progress'])->assertSessionHasErrors('status');
        $this->assertSame(NodeStatus::Available, $node->fresh()->status);
    }

    public function test_node_cannot_be_uncompleted_while_dependents_progressed(): void
    {
        $prerequisite = SkillNode::factory()->completed()->create();
        SkillNode::factory()->requires($prerequisite)->inProgress()->create();

        $this->patch("/nodes/{$prerequisite->id}/status", ['status' => 'available'])->assertSessionHasErrors('status');
        $this->assertSame(NodeStatus::Completed, $prerequisite->fresh()->status);
    }

    public function test_node_can_be_uncompleted_when_dependents_untouched(): void
    {
        $prerequisite = SkillNode::factory()->completed()->create();
        SkillNode::factory()->requires($prerequisite)->create();

        $this->patch("/nodes/{$prerequisite->id}/status", ['status' => 'in_progress'])->assertSessionHasNoErrors();
        $this->assertNull($prerequisite->fresh()->completed_at);
    }
}
