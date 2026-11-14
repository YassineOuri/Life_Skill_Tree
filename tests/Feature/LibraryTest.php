<?php

namespace Tests\Feature;

use App\Enums\NodeStatus;
use App\Models\Category;
use App\Models\QuestStep;
use App\Models\SkillNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LibraryTest extends TestCase
{
    use RefreshDatabase;

    /** Languages → English C1 ; Career → International job (requires English C1, cross-category). */
    private function seedTree(): array
    {
        $languages = Category::factory()->create(['name' => 'Languages', 'color' => '#a855f7', 'icon' => 'languages', 'position' => 0]);
        $career = Category::factory()->create(['name' => 'Career', 'color' => '#38bdf8', 'icon' => 'briefcase', 'position' => 1]);
        $english = SkillNode::factory()->completed()->create([
            'category_id' => $languages->id, 'title' => 'English C1', 'rarity' => 'epic', 'completed_at' => '2024-05-01 10:00:00',
        ]);
        $job = SkillNode::factory()->create(['category_id' => $career->id, 'title' => 'International job', 'target_date' => '2027-01-01']);
        $job->prerequisites()->attach($english);
        QuestStep::factory()->for($job, 'node')->create(['title' => 'Update CV', 'done_at' => '2026-10-01 10:00:00']);
        QuestStep::factory()->for($job, 'node')->create(['title' => 'Apply']);

        return compact('languages', 'career', 'english', 'job');
    }

    private function jsonFile(array|string $content): UploadedFile
    {
        $json = is_string($content) ? $content : json_encode($content);

        return UploadedFile::fake()->createWithContent('backup.json', $json);
    }

    private function backup(array $overrides = []): array
    {
        return array_replace_recursive([
            'version' => 1,
            'categories' => [[
                'name' => 'Imported',
                'color' => '#22c55e',
                'icon' => 'star',
                'skills' => [
                    ['ref' => 'a', 'title' => 'A', 'status' => 'completed', 'rarity' => 'rare', 'completed_at' => '2025-01-01', 'prerequisites' => [], 'steps' => []],
                    ['ref' => 'b', 'title' => 'B', 'status' => 'available', 'prerequisites' => ['a'], 'steps' => [['title' => 'Step', 'done_at' => null]]],
                ],
            ]],
        ], $overrides);
    }

    public function test_export_contains_the_whole_tree(): void
    {
        $this->seedTree();

        $response = $this->get('/library/export')->assertOk()->assertDownload('life-skill-tree-'.now()->format('Y-m-d').'.json');
        $data = json_decode($response->getContent(), true);

        $this->assertSame(1, $data['version']);
        $this->assertSame(['Languages', 'Career'], array_column($data['categories'], 'name'));
        $english = $data['categories'][0]['skills'][0];
        $job = $data['categories'][1]['skills'][0];
        $this->assertSame(['English C1', 'epic', 'completed', '2024-05-01'], [$english['title'], $english['rarity'], $english['status'], substr($english['completed_at'], 0, 10)]);
        $this->assertSame([$english['ref']], $job['prerequisites']);
        $this->assertSame('2027-01-01', $job['target_date']);
        $this->assertSame(['Update CV', 'Apply'], array_column($job['steps'], 'title'));
        $this->assertNotNull($job['steps'][0]['done_at']);
        $this->assertNull($job['steps'][1]['done_at']);
    }

    public function test_export_then_import_duplicates_the_tree_as_new_categories(): void
    {
        $this->seedTree();
        $export = $this->get('/library/export');
        $json = $export->getContent();

        $this->post('/library/import', ['file' => $this->jsonFile($json)])->assertSessionHasNoErrors();

        $this->assertSame(
            ['Languages', 'Career', 'Languages (imported)', 'Career (imported)'],
            Category::orderBy('id')->pluck('name')->all(),
        );
        $this->assertDatabaseCount('skill_nodes', 4);
        $this->assertDatabaseCount('skill_prerequisites', 2);
        $this->assertDatabaseCount('quest_steps', 4);

        $importedJob = SkillNode::where('title', 'International job')->latest('id')->first();
        $importedEnglish = $importedJob->prerequisites->first();
        $this->assertSame('English C1', $importedEnglish->title);
        $this->assertSame('Languages (imported)', $importedEnglish->category->name);
        $this->assertSame(NodeStatus::Completed, $importedEnglish->status);
        $this->assertSame('2024-05-01', $importedEnglish->completed_at->format('Y-m-d'));
    }

    public function test_invalid_json_is_rejected(): void
    {
        $this->post('/library/import', ['file' => $this->jsonFile('{not json')])->assertSessionHasErrors('file');
    }

    public function test_wrong_version_is_rejected(): void
    {
        $this->post('/library/import', ['file' => $this->jsonFile($this->backup(['version' => 2]))])->assertSessionHasErrors('file');
    }

    public function test_bad_status_is_rejected(): void
    {
        $backup = $this->backup();
        $backup['categories'][0]['skills'][0]['status'] = 'mastered';

        $this->post('/library/import', ['file' => $this->jsonFile($backup)])->assertSessionHasErrors('file');
    }

    public function test_unknown_prerequisite_ref_is_rejected_without_partial_writes(): void
    {
        $backup = $this->backup();
        $backup['categories'][0]['skills'][1]['prerequisites'] = ['nope'];

        $this->post('/library/import', ['file' => $this->jsonFile($backup)])->assertSessionHasErrors('file');

        $this->assertDatabaseCount('categories', 0);
        $this->assertDatabaseCount('skill_nodes', 0);
    }

    public function test_cycle_is_rejected(): void
    {
        $backup = $this->backup();
        $backup['categories'][0]['skills'][0]['prerequisites'] = ['b'];

        $this->post('/library/import', ['file' => $this->jsonFile($backup)])->assertSessionHasErrors('file');

        $this->assertDatabaseCount('skill_nodes', 0);
    }

    public function test_duplicate_ref_is_rejected(): void
    {
        $backup = $this->backup();
        $backup['categories'][0]['skills'][1]['ref'] = 'a';

        $this->post('/library/import', ['file' => $this->jsonFile($backup)])->assertSessionHasErrors('file');
    }

    public function test_valid_backup_is_imported(): void
    {
        $this->post('/library/import', ['file' => $this->jsonFile($this->backup())])->assertSessionHasNoErrors();

        $b = SkillNode::firstWhere('title', 'B');
        $this->assertSame('Imported', $b->category->name);
        $this->assertSame(['A'], $b->prerequisites->pluck('title')->all());
        $this->assertFalse($b->locked);
        $this->assertSame(['Step'], $b->steps->pluck('title')->all());
    }

    public function test_index_lists_templates(): void
    {
        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->component('SkillTree/Index', false)
            ->has('templates', 4)
            ->where('templates.0.key', 'aws')
            ->has('templates.0.name')
            ->has('templates.0.skills')
        );
    }

    public function test_template_can_be_applied_to_an_existing_category(): void
    {
        $career = Category::factory()->create();
        SkillNode::factory()->create(['category_id' => $career->id]);

        $this->post('/library/templates/kubernetes', ['category_id' => $career->id])->assertSessionHasNoErrors();

        $cka = SkillNode::firstWhere('title', 'CKA');
        $this->assertSame($career->id, $cka->category_id);
        $this->assertSame(['KCNA'], $cka->prerequisites->pluck('title')->all());
        $this->assertTrue(SkillNode::where('category_id', $career->id)->where('title', '!=', 'CKA')->exists());
        $this->assertSame(0, SkillNode::where('status', '!=', 'available')->count());
        $this->assertSame(0, QuestStep::whereNotNull('done_at')->count());
        $this->assertGreaterThan(0, $cka->steps()->count());
    }

    public function test_template_can_create_a_new_category(): void
    {
        $this->post('/library/templates/languages', [
            'new_category' => ['name' => 'Spanish', 'color' => '#ef4444', 'icon' => 'languages'],
        ])->assertSessionHasNoErrors();

        $spanish = Category::firstWhere('name', 'Spanish');
        $this->assertSame(6, $spanish->nodes()->count());
        $this->assertSame(['B2'], SkillNode::firstWhere('title', 'C1')->prerequisites->pluck('title')->all());
    }

    public function test_template_needs_exactly_one_target(): void
    {
        $category = Category::factory()->create();

        $this->post('/library/templates/running', [])->assertSessionHasErrors();
        $this->post('/library/templates/running', [
            'category_id' => $category->id,
            'new_category' => ['name' => 'X', 'color' => '#000000'],
        ])->assertSessionHasErrors();
        $this->assertDatabaseCount('skill_nodes', 0);
    }

    public function test_unknown_template_is_404(): void
    {
        $category = Category::factory()->create();

        $this->post('/library/templates/nope', ['category_id' => $category->id])->assertNotFound();
    }
}
