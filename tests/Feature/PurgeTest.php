<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\QuestStep;
use App\Models\SkillNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PurgeTest extends TestCase
{
    use RefreshDatabase;

    private function seedData(): string
    {
        Storage::fake('local');
        $a = SkillNode::factory()->completed()->create();
        $b = SkillNode::factory()->requires($a)->create();
        QuestStep::factory()->for($b, 'node')->create();
        $this->post("/nodes/{$b->id}/files", ['files' => [UploadedFile::fake()->create('cert.pdf', 10, 'application/pdf')]]);

        return $b->files()->first()->path;
    }

    public function test_purge_deletes_everything_including_files(): void
    {
        $path = $this->seedData();
        Storage::disk('local')->put('evidence/999/orphan.pdf', 'x');

        $this->delete('/library/purge', ['confirm' => 'DELETE'])->assertRedirect('/');

        foreach (['categories', 'skill_nodes', 'skill_prerequisites', 'quest_steps', 'evidence_files'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        Storage::disk('local')->assertMissing($path);
        Storage::disk('local')->assertMissing('evidence/999/orphan.pdf');
    }

    public function test_purge_requires_typed_confirmation(): void
    {
        $this->seedData();

        $this->delete('/library/purge', ['confirm' => 'delete please'])->assertSessionHasErrors('confirm');
        $this->delete('/library/purge')->assertSessionHasErrors('confirm');

        $this->assertDatabaseCount('skill_nodes', 2);
        $this->assertGreaterThan(0, Category::count());
    }
}
