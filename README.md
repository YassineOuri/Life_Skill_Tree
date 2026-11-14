# Life Skill Tree

An RPG-style skill tree for your life. Each area of your life (Career, Health, Finance, Languages, Hobbies…) is a category, and inside it, skills branch into more skills. For example, **Career → Cloud Engineer → AWS Cloud Practitioner → AWS Solutions Architect Associate → Professional**.

A skill unlocks once all its prerequisites are completed. Completing skills earns XP, levels up your categories and your character, and writes your story in the **Chronicle**.

Built with Laravel 12, Inertia 2, React 19, Tailwind CSS 4, React Flow and dagre, on SQLite. It's a single-user app meant to run locally.

---

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Using the app](#using-the-app)
- [Game rules](#game-rules)
- [Backups and templates](#backups-and-templates)
- [Project structure](#project-structure)
- [Routes](#routes)
- [Development](#development)
- [Notes and limitations](#notes-and-limitations)

---

## Features

| Area | What you get |
|---|---|
| **Skill tree** | Pan/zoom canvas, auto-layout per category, "All" view or one tab per category, minimap |
| **Progression** | Statuses *Available → Training → Completed*; skills stay locked until all their prerequisites are completed |
| **Prerequisites** | A skill can require several skills, from any category (e.g. *English C1* → *International cloud role*); cycles are refused |
| **Quests** | A checklist of steps per skill, shown as a progress bar (cards) or ring (medallions) |
| **XP and levels** | Rarity tiers (Common, Rare, Epic, Legendary) grant XP and build category levels plus an overall character level |
| **Deadlines** | Target dates with an amber "due soon" badge and a red "overdue" badge, plus a countdown |
| **Evidence** | Attach certificate PDFs and images (up to 10 MB each) to a skill, with preview and download |
| **Chronicle** | A timeline of completed skills, quest steps and level-ups, plus your upcoming targets |
| **Search** | `Ctrl+K` / `Cmd+K` to jump to any skill or category |
| **Library** | Built-in learning paths, JSON backup export and import, and a full reset |
| **Look and feel** | Game-style UI (polygon cards, hex medallions, gold trim), **night** and **parchment** themes, **cards** or **medallions** layout, unlock/completion effects, generated sound effects with mute |

---

## Requirements

- PHP **8.2+** with the `pdo_sqlite` and `fileinfo` extensions
- Composer 2
- Node.js **20.19+** (needed by Vite 7) and npm

---

## Quick start

```bash
composer install
npm install
cp .env.example .env            # DB_CONNECTION=sqlite is already the default
php artisan key:generate
php artisan migrate --seed      # creates database/database.sqlite with an example tree
composer run dev                # app on http://127.0.0.1:8000
```

`composer run dev` starts the PHP server, the queue listener and Vite together.

To serve built assets without Vite running, use:

```bash
npm run build
php artisan serve
```

**Example data.** The seeder creates five categories with about 20 skills. It includes several prerequisites at once (Docker + Linux → Kubernetes), a cross-category link (English C1 → International cloud role), quest steps in progress and a few target dates. Wipe it from the app (Library → Reset), or go back to it at any time with:

```bash
php artisan migrate:fresh --seed
```

---

## Using the app

### The tree

- **Tabs** at the top show one category or **All**. Each tab shows its progress.
- **Pan** by dragging and **zoom** with the mouse wheel. Use the corner controls or the minimap to find your way.
- **Click a category hub** (the large gold card) to add a skill with no prerequisites, or to edit or delete the category.
- **Click a skill** to open its side panel.

### The skill panel

| Section | What you can do |
|---|---|
| **Status** | Set *Available*, *Training* or *Completed*. The buttons are disabled while the skill is locked |
| **Quest** | Add steps, click a step to rename it, tick it off, delete it |
| **Evidence** | Upload PDFs or images (click or drag and drop), preview, download, delete |
| **Requires / Unlocks** | Linked skills; clicking one jumps to it, even in another category |
| **Record** | Target date with countdown, completion date, evidence link |
| **Actions** | **Branch** (create a skill that requires this one), **Edit**, **Delete** |

The **Edit** form covers the title, prerequisites (grouped by category), description, rarity, icon (picker with about 90 icons), target date, completion date (to backdate certificates you already have) and an evidence URL.

### Header buttons

| Button | Action |
|---|---|
| 🔍 `Ctrl K` | Search palette: ↑/↓ to move, Enter to jump, Esc to close |
| 📚 | **Library**: Templates, Import, Export, Reset |
| **Chronicle** | Timeline page |
| 🔊 | Sound on/off |
| ◉ / ▭ | Switch between medallions and cards |
| 📜 / 🌙 | Switch between the parchment and night themes |
| **+ Category** | Create a category (name, colour, icon) |

Theme, layout and sound settings are saved in your browser (`localStorage`).

---

## Game rules

**Statuses and locking**

- A skill is `available`, `in_progress` (shown as **Training**) or `completed`.
- **Locked** isn't stored. It's worked out live: a skill is locked while **any** of its prerequisites isn't completed. A skill without prerequisites is never locked.
- A locked skill's status and quest steps cannot change.
- A completed skill cannot be set back while a skill that requires it is in progress or completed.

**Prerequisites**

- They can come from any category. In the **All** view, cross-category links are drawn as gold dashed curves; in a single tab, the skill shows a link badge instead.
- They can't form a cycle (A → B → … → A), even across categories.
- Deleting a skill keeps the skills that required it; they simply lose that prerequisite.

**Quests**

- Ticking the first step of an *Available* skill switches it to *Training*.
- Finishing all steps does **not** complete the skill. You decide when it's done.

**XP and levels**

| Rarity | XP when completed |
|---|---|
| Common | 10 |
| Rare | 25 |
| Epic | 50 |
| Legendary | 100 |

Level *L* needs `25 × L × (L − 1)` XP in total: level 2 at 50 XP, level 3 at 150, level 4 at 300, level 5 at 500, and so on. Each category has its own level, and the header shows your overall character level. Setting a completed skill back removes its XP, so levels can go down.

**Deadlines**

| Badge | Meaning |
|---|---|
| Amber clock | Target date within the next 14 days |
| Red pulsing clock | Target date passed and skill not completed |

---

## Backups and templates

Everything lives in the **Library** (📚 in the header).

### Export

**Export** downloads `life-skill-tree-YYYY-MM-DD.json`:

```json
{
  "version": 1,
  "exported_at": "2026-11-14T10:00:00+00:00",
  "categories": [
    {
      "name": "Career",
      "color": "#38bdf8",
      "icon": "briefcase",
      "skills": [
        {
          "ref": "s12",
          "title": "International cloud role",
          "description": null,
          "icon": "globe",
          "rarity": "legendary",
          "status": "available",
          "target_date": "2027-07-12",
          "completed_at": null,
          "evidence_url": null,
          "prerequisites": ["s3", "s21"],
          "steps": [{ "title": "Update CV", "done_at": "2026-10-01T10:00:00+00:00" }],
          "files": ["offer-letter.pdf"]
        }
      ]
    }
  ]
}
```

- `ref` is unique across the whole file, so prerequisites in other categories survive an import.
- `files` lists names only; the uploaded files themselves aren't included in the backup.

### Import

**Import** adds a backup as **new categories**. Nothing you already have is changed or deleted, and a name that already exists gets "(imported)" appended.

The whole file is checked first: version, statuses, rarities, dates, unknown or duplicate refs, and cycles. A bad file is refused and writes nothing.

### Templates

**Templates** add a ready-made learning path to an existing or new category. Every skill starts *Available*, with its quest steps ready to tick.

| Template | Path |
|---|---|
| AWS certifications | Cloud Practitioner → Associate tier (SAA, Developer, SysOps) → Professional (SA Pro, DevOps Pro) |
| Kubernetes (CNCF) | Linux + Containers → KCNA → CKA / CKAD → CKS |
| Language ladder (CEFR) | A1 → A2 → B1 → B2 → C1 → C2 |
| Running ladder | 5K → 10K → Half marathon → Marathon → Ultra trail |

To add your own, create `app/Library/Templates/{key}.php` in the same format and add the key to `TemplateLibrary::KEYS`.

### Reset

**Reset** deletes every category, skill, prerequisite, quest step and uploaded file once you type `DELETE`. It can't be undone, so export a backup first.

---

## Project structure

```
app/
├── Enums/                 NodeStatus, Rarity (+ XP per rarity)
├── Http/
│   ├── Controllers/       SkillTree, Category, SkillNode, QuestStep,
│   │                      EvidenceFile, Chronicle, Library
│   └── Requests/          validation (prerequisites, cycles, dates, rarity…)
├── Library/               TreeExporter, TreeImporter, TemplateLibrary, Templates/*.php
├── Models/                Category, SkillNode, QuestStep, EvidenceFile
├── Services/              NodeStatusService (locking and un-complete rules)
└── Support/               Progression (XP → level curve)

resources/js/
├── Pages/
│   ├── SkillTree/Index.jsx    canvas, header, search, panels, modals
│   └── Chronicle/Index.jsx    timeline + upcoming targets
├── Components/            SkillNode, CategoryNode, NodePanel, NodeForm, QuestSteps,
│                          EvidenceFiles, IconPicker, SearchPalette, LibraryModal,
│                          CategoryModal, ui (Frame, Hex, GameButton, Burst…)
└── lib/                   layout (dagre → React Flow), progression, deadlines,
                           icons (curated set), sound (Web Audio)

database/
├── migrations/            categories, skill_nodes, skill_prerequisites,
│                          quest_steps, evidence_files
└── seeders/DatabaseSeeder.php   example tree

tests/
├── Feature/               Category, SkillNode, SkillTreeIndex, Progression, QuestStep,
│                          Chronicle, EvidenceFile, Library, Purge
└── Unit/ProgressionTest.php
```

**Data model**

```
categories 1──n skill_nodes 1──n quest_steps
                skill_nodes 1──n evidence_files
                skill_nodes n──n skill_nodes   (skill_prerequisites: skill_node_id → prerequisite_id)
```

---

## Routes

All routes are web (Inertia) routes. Form errors come back in Inertia's `errors` bag.

| Method | URI | Purpose |
|---|---|---|
| GET | `/` | Skill tree page |
| POST / PUT / DELETE | `/categories`, `/categories/{category}` | Category CRUD (deleting removes its skills and files) |
| POST / PUT / DELETE | `/nodes`, `/nodes/{node}` | Skill CRUD |
| PATCH | `/nodes/{node}/status` | Change status (enforces the locking rules) |
| POST | `/nodes/{node}/steps` | Add quest step |
| PUT / DELETE | `/steps/{step}` | Rename / delete step |
| PATCH | `/steps/{step}/toggle` | Tick / untick step |
| POST | `/nodes/{node}/files` | Upload evidence (`files[]`, pdf/png/jpg/jpeg/webp, ≤ 10 MB each) |
| GET | `/files/{file}`, `/files/{file}/download` | View inline / download |
| DELETE | `/files/{file}` | Delete evidence (also from disk) |
| GET | `/chronicle` | Timeline page |
| GET | `/library/export` | JSON backup download |
| POST | `/library/import` | Import backup (`file`, ≤ 2 MB) |
| POST | `/library/templates/{key}` | Apply template (`category_id` **or** `new_category {name, color, icon}`) |
| DELETE | `/library/purge` | Delete all data (`confirm=DELETE`) |

---

## Development

```bash
php artisan test          # 76 PHPUnit tests (feature + unit)
npm run build             # production assets in public/build
npm run dev               # Vite dev server with hot reload
php artisan migrate:fresh --seed   # reset the database to the example tree
```

- **Tests** run on an in-memory SQLite database (`phpunit.xml`) with a fake storage disk, so they never touch your data.
- **Icons** are a curated set in `resources/js/lib/icons.js`. Only these are bundled. To add one, import it from `lucide-react` and add it to a group in `ICON_GROUPS`. A name outside the set shows as a sparkle.
- **Theme colours** are CSS variables in `resources/css/app.css`. The parchment theme overrides them under `[data-theme='parchment']`.
- **Sounds** are synthesised in `resources/js/lib/sound.js`; there are no audio files.

---

## Notes and limitations

- **No login.** The app is built for one person on their own machine. Add authentication before putting it on a server.
- **Data** lives in `database/database.sqlite` and uploaded files in `storage/app/private/evidence/`. Back both up, or use **Library → Export** (which doesn't include the uploaded files).
- **Sounds** start after your first click, because browsers block audio until then. They can be muted from the header.
- **Bundle size:** the JS bundle is about 780 KB (about 255 KB gzipped), mostly React, React Flow and the layout library.
