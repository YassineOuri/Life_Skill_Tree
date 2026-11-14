<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Replace the single parent with 0..n prerequisites. Existing parent links are kept as prerequisites.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skill_prerequisites', function (Blueprint $table) {
            $table->foreignId('skill_node_id')->constrained('skill_nodes')->cascadeOnDelete();
            $table->foreignId('prerequisite_id')->constrained('skill_nodes')->cascadeOnDelete();
            $table->primary(['skill_node_id', 'prerequisite_id']);
        });

        DB::table('skill_nodes')->whereNotNull('parent_id')->orderBy('id')->each(function ($node) {
            DB::table('skill_prerequisites')->insert([
                'skill_node_id' => $node->id,
                'prerequisite_id' => $node->parent_id,
            ]);
        });

        Schema::table('skill_nodes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
        });
    }

    public function down(): void
    {
        Schema::table('skill_nodes', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('category_id')->constrained('skill_nodes')->cascadeOnDelete();
        });

        // A tree only has one parent: keep the first prerequisite of each node.
        DB::table('skill_prerequisites')->orderBy('prerequisite_id')->get()
            ->unique('skill_node_id')
            ->each(fn ($row) => DB::table('skill_nodes')->where('id', $row->skill_node_id)->update(['parent_id' => $row->prerequisite_id]));

        Schema::dropIfExists('skill_prerequisites');
    }
};
