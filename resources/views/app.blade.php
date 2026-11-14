<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Life Skill Tree</title>
    <script>
        // Apply the saved theme before first paint (avoids a dark flash for parchment users).
        try { document.documentElement.dataset.theme = localStorage.getItem('skill-tree.theme') || 'dark' } catch (e) {}
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="bg-ink-950 font-sans text-parchment antialiased">
@inertia
</body>
</html>
