<?php

namespace Tests\Feature;

use App\Enums\NodeStatus;
use App\Models\QuestStep;
use App\Models\SkillNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuestStepTest extends TestCase
{
    use RefreshDatabase;

    public function test_step_can_be_added(): void
    {
        $node = SkillNode::factory()->create();

        $this->post("/nodes/{$node->id}/steps", ['title' => 'Watch the course'])->assertSessionHasNoErrors();
        $this->post("/nodes/{$node->id}/steps", ['title' => 'Practice exam'])->assertSessionHasNoErrors();

        $this->assertSame(['Watch the course', 'Practice exam'], $node->steps()->pluck('title')->all());
        $this->assertSame([0, 1], $node->steps()->pluck('position')->all());
    }

    public function test_step_title_is_required(): void
    {
        $node = SkillNode::factory()->create();

        $this->post("/nodes/{$node->id}/steps", ['title' => ''])->assertSessionHasErrors('title');
    }

    public function test_step_can_be_renamed(): void
    {
        $step = QuestStep::factory()->create();

        $this->put("/steps/{$step->id}", ['title' => 'Labs'])->assertSessionHasNoErrors();

        $this->assertSame('Labs', $step->fresh()->title);
    }

    public function test_toggle_sets_and_clears_done_at(): void
    {
        $step = QuestStep::factory()->create();

        $this->patch("/steps/{$step->id}/toggle")->assertSessionHasNoErrors();
        $this->assertNotNull($step->fresh()->done_at);

        $this->patch("/steps/{$step->id}/toggle")->assertSessionHasNoErrors();
        $this->assertNull($step->fresh()->done_at);
    }

    public function test_first_checked_step_starts_training(): void
    {
        $step = QuestStep::factory()->create();

        $this->patch("/steps/{$step->id}/toggle");

        $this->assertSame(NodeStatus::InProgress, $step->node->fresh()->status);
    }

    public function test_all_steps_done_does_not_complete_the_skill(): void
    {
        $step = QuestStep::factory()->create();

        $this->patch("/steps/{$step->id}/toggle");

        $this->assertNotSame(NodeStatus::Completed, $step->node->fresh()->status);
    }

    public function test_steps_are_blocked_on_locked_skill(): void
    {
        $prerequisite = SkillNode::factory()->create();
        $node = SkillNode::factory()->requires($prerequisite)->create();
        $step = QuestStep::factory()->for($node, 'node')->create();

        $this->post("/nodes/{$node->id}/steps", ['title' => 'X'])->assertSessionHasErrors('steps');
        $this->patch("/steps/{$step->id}/toggle")->assertSessionHasErrors('steps');
        $this->assertNull($step->fresh()->done_at);
    }

    public function test_step_can_be_deleted(): void
    {
        $step = QuestStep::factory()->create();

        $this->delete("/steps/{$step->id}")->assertRedirect();

        $this->assertModelMissing($step);
    }

    public function test_index_includes_steps(): void
    {
        $step = QuestStep::factory()->create(['title' => 'Labs']);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->component('SkillTree/Index', false)
            ->where('nodes.0.steps.0.id', $step->id)
            ->where('nodes.0.steps.0.title', 'Labs')
            ->where('nodes.0.steps.0.done_at', null)
        );
    }
}
