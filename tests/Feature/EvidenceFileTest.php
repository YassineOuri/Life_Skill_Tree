<?php

namespace Tests\Feature;

use App\Models\EvidenceFile;
use App\Models\SkillNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EvidenceFileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    private function upload(SkillNode $node, array $files)
    {
        return $this->post("/nodes/{$node->id}/files", ['files' => $files]);
    }

    public function test_several_files_can_be_uploaded(): void
    {
        $node = SkillNode::factory()->create();

        $this->upload($node, [
            UploadedFile::fake()->create('aws-saa.pdf', 300, 'application/pdf'),
            UploadedFile::fake()->image('badge.png'),
        ])->assertSessionHasNoErrors();

        $files = $node->files()->get();
        $this->assertSame(['aws-saa.pdf', 'badge.png'], $files->pluck('original_name')->all());
        $files->each(fn (EvidenceFile $file) => Storage::disk('local')->assertExists($file->path));
    }

    public function test_bad_type_is_rejected_and_nothing_is_stored(): void
    {
        $node = SkillNode::factory()->create();

        $this->upload($node, [
            UploadedFile::fake()->create('ok.pdf', 10, 'application/pdf'),
            UploadedFile::fake()->create('script.exe', 10, 'application/octet-stream'),
        ])->assertSessionHasErrors('files.1');

        $this->assertDatabaseCount('evidence_files', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_file_larger_than_10mb_is_rejected(): void
    {
        $node = SkillNode::factory()->create();

        $this->upload($node, [UploadedFile::fake()->create('huge.pdf', 10241, 'application/pdf')])
            ->assertSessionHasErrors('files.0');
    }

    public function test_file_can_be_viewed_inline_and_downloaded(): void
    {
        $node = SkillNode::factory()->create();
        $this->upload($node, [UploadedFile::fake()->create('cert.pdf', 20, 'application/pdf')]);
        $file = $node->files()->first();

        $this->get("/files/{$file->id}")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertHeader('content-disposition', 'inline; filename=cert.pdf');

        $this->get("/files/{$file->id}/download")
            ->assertOk()
            ->assertDownload('cert.pdf');
    }

    public function test_missing_file_on_disk_returns_404(): void
    {
        $node = SkillNode::factory()->create();
        $this->upload($node, [UploadedFile::fake()->create('cert.pdf', 20, 'application/pdf')]);
        $file = $node->files()->first();
        Storage::disk('local')->delete($file->path);

        $this->get("/files/{$file->id}")->assertNotFound();
    }

    public function test_deleting_a_file_removes_it_from_disk(): void
    {
        $node = SkillNode::factory()->create();
        $this->upload($node, [UploadedFile::fake()->create('cert.pdf', 20, 'application/pdf')]);
        $file = $node->files()->first();

        $this->delete("/files/{$file->id}")->assertRedirect();

        $this->assertModelMissing($file);
        Storage::disk('local')->assertMissing($file->path);
    }

    public function test_deleting_the_skill_removes_its_files(): void
    {
        $node = SkillNode::factory()->create();
        $this->upload($node, [UploadedFile::fake()->create('cert.pdf', 20, 'application/pdf')]);
        $path = $node->files()->first()->path;

        $this->delete("/nodes/{$node->id}");

        Storage::disk('local')->assertMissing($path);
        $this->assertDatabaseCount('evidence_files', 0);
    }

    public function test_deleting_the_category_removes_its_files(): void
    {
        $node = SkillNode::factory()->create();
        $this->upload($node, [UploadedFile::fake()->create('cert.pdf', 20, 'application/pdf')]);
        $path = $node->files()->first()->path;

        $this->delete("/categories/{$node->category_id}");

        Storage::disk('local')->assertMissing($path);
        $this->assertDatabaseCount('skill_nodes', 0);
    }

    public function test_index_lists_files(): void
    {
        $node = SkillNode::factory()->create();
        $this->upload($node, [UploadedFile::fake()->create('cert.pdf', 20, 'application/pdf')]);
        $file = $node->files()->first();

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->component('SkillTree/Index', false)
            ->where('nodes.0.files.0.id', $file->id)
            ->where('nodes.0.files.0.name', 'cert.pdf')
            ->where('nodes.0.files.0.mime', 'application/pdf')
            ->where('nodes.0.files.0.url', "/files/{$file->id}")
            ->where('nodes.0.files.0.download_url', "/files/{$file->id}/download")
        );
    }
}
