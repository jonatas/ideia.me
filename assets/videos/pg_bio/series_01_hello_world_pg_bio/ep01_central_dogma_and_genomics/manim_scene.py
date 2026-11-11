"""
Programmatic Manim Animation for: Ep 1: Hello World, pg_bio! The Central Dogma in SQL (Layers 1 & 6: Genomics (int4range GiST) & Sequence Physics)
Styled with the exact `ideia.me` theme palette and persistent footer.
Render with:
    uv run --with manim manim -pqh videos/ep01_central_dogma_and_genomics/manim_scene.py FeatureScene
"""

from manim import (
    Arrow,
    Create,
    FadeIn,
    FadeOut,
    RoundedRectangle,
    Scene,
    Text,
    VGroup,
    Write,
    DOWN,
    LEFT,
    RIGHT,
    UP,
)

# Exact ideia.me Theme Hex Colors
IDEIA_BG = "#0f1117"
IDEIA_CARD = "#161b27"
IDEIA_BLUE = "#5c9eff"
IDEIA_PURPLE = "#b158fc"
IDEIA_PINK = "#ff5a9d"
IDEIA_TEAL = "#0d9488"
IDEIA_TEXT = "#ccd6f6"
IDEIA_MUTED = "#8892b0"


class FeatureScene(Scene):
    def construct(self):
        self.camera.background_color = IDEIA_BG

        title = Text("Ep 1: Hello World, pg_bio! The Central Dogma in SQL", font_size=32, color=IDEIA_BLUE).to_edge(UP)
        subtitle = Text("Layers 1 & 6: Genomics (int4range GiST) & Sequence Physics  |  200x faster than BioPython (~200 ns/protein in Rust)", font_size=19, color=IDEIA_PURPLE).next_to(title, DOWN, buff=0.18)
        footer_bar = Text(
            "https://ideia.me   |   pg_bio Multiomics Engine   |   https://github.com/jonatas/pg_bio",
            font_size=16,
            color=IDEIA_MUTED,
        ).to_edge(DOWN, buff=0.22)

        self.play(Write(title), FadeIn(subtitle), FadeIn(footer_bar))

        py_box = RoundedRectangle(corner_radius=0.2, width=5.5, height=3.2, color=IDEIA_PINK, fill_opacity=0.15)
        py_title = Text("Traditional Python Pipeline", font_size=21, color=IDEIA_PINK).move_to(py_box.get_top() + DOWN * 0.4)
        py_steps = VGroup(
            Text("1. TCP Socket Pull (GBs of rows)", font_size=16, color=IDEIA_TEXT),
            Text("2. PyObject & NumPy Allocation", font_size=16, color=IDEIA_TEXT),
            Text("3. O(N^2) User-Space Loops", font_size=16, color=IDEIA_TEXT),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.25).move_to(py_box.get_center() + DOWN * 0.2)
        py_group = VGroup(py_box, py_title, py_steps).to_edge(LEFT, buff=0.6).shift(DOWN * 0.2)

        pg_box = RoundedRectangle(corner_radius=0.2, width=5.5, height=3.2, color=IDEIA_TEAL, fill_opacity=0.15)
        pg_title = Text("pg_bio (Rust inside Postgres)", font_size=21, color=IDEIA_BLUE).move_to(pg_box.get_top() + DOWN * 0.4)
        pg_steps = VGroup(
            Text("1. Zero-IPC Shared Buffer Pointers", font_size=16, color=IDEIA_TEXT),
            Text("2. Index Sieve (B-Tree / GiST / HNSW)", font_size=16, color=IDEIA_TEXT),
            Text("3. LLVM SIMD Physics on Survivors", font_size=16, color=IDEIA_TEXT),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.25).move_to(pg_box.get_center() + DOWN * 0.2)
        pg_group = VGroup(pg_box, pg_title, pg_steps).to_edge(RIGHT, buff=0.6).shift(DOWN * 0.2)

        bridge_arrow = Arrow(py_group.get_right(), pg_group.get_left(), buff=0.2, color=IDEIA_PURPLE)

        self.play(Create(py_box), Write(py_title), FadeIn(py_steps))
        self.wait(0.8)
        self.play(Create(bridge_arrow), Create(pg_box), Write(pg_title), FadeIn(pg_steps))
        self.wait(2.5)
        self.play(FadeOut(py_group), FadeOut(pg_group), FadeOut(bridge_arrow))
