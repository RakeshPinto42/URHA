/**
 * Artwork registry (docs/CINEMATIC_DIRECTION.md §2, Concept I).
 *
 * Every picture is a real, credited public-domain or CC work. Paintings are
 * shown and captioned as *artworks*, painters' imaginings, never as historical
 * evidence or authentic portraits. Sources and licences:
 * public/art/credits.json and public/images/credits.json (both shown on /credits).
 */
import type { StaticImageData } from "next/image";
import friedrich from "@/public/art/riesengebirge-morning-friedrich.jpg";
import rembrandt from "@/public/art/philosopher-in-meditation-rembrandt.jpg";
import aivazovsky from "@/public/art/walking-on-water-aivazovsky.jpg";
import bloch from "@/public/art/sermon-on-the-mount-bloch.jpg";
import kramskoi from "@/public/art/christ-in-the-wilderness-kramskoi.jpg";
import vangogh from "@/public/art/good-samaritan-van-gogh.jpg";
import galilee from "@/public/art/galilee-sunrise.jpg";
import appian from "@/public/images/appian-way.jpg";
import peutinger from "@/public/images/peutinger-lazio.png";
import syriacLeaf from "@/public/images/syriac-liturgy-11c.jpg";
import barhebraeus from "@/public/images/syriac-barhebraeus.jpg";
import brindisi from "@/public/images/appia-brindisi-night.jpg";

export type Artwork = {
  id: string;
  src: StaticImageData;
  /** Short caption line: "Artist, Title, year" or a photograph's description. */
  caption: string;
  kind: "painting" | "photograph" | "manuscript" | "map";
  alt: string;
  theme: string; // what it carries in URHA
  /** CSS object-position, chosen after looking at each picture. */
  focus: string;
};

export const ART = {
  path: { id: "path", src: friedrich, kind: "painting", focus: "62% 58%",
    caption: "Caspar David Friedrich, Morning in the Riesengebirge, 1810–11. Oil painting.",
    alt: "Painting of mountain ridges fading into morning mist under a pale sky, a small cross on a rocky summit catching the first light.",
    theme: "A path through mountains towards light: growth, direction and mastery." },
  study: { id: "study", src: rembrandt, kind: "painting", focus: "30% 55%",
    caption: "Rembrandt, Philosopher in Meditation, 1632. Oil painting (photograph by Curiographe, CC BY 3.0).",
    alt: "Painting of a dim room lit by one tall window; an old scholar sits by the light beside a spiral stair while a woman tends a small fire.",
    theme: "The candlelit study: knowledge, learning and intellectual curiosity." },
  water: { id: "water", src: aivazovsky, kind: "painting", focus: "55% 32%",
    caption: "Ivan Aivazovsky, Walking on Water, 1888. Oil painting, an artist's imagining.",
    alt: "Painting of a figure in pale robes walking on a dark, stormy sea towards a man in the waves and fishermen in a boat.",
    theme: "Courage, faith and overcoming limitations." },
  mount: { id: "mount", src: bloch, kind: "painting", focus: "62% 30%",
    caption: "Carl Bloch, The Sermon on the Mount, 1877. Oil painting, an artist's imagining.",
    alt: "Painting of a teacher seated on a rock with one hand raised, a crowd of listeners around him on a hillside.",
    theme: "Wisdom, understanding and human values put into practice." },
  wilderness: { id: "wilderness", src: kramskoi, kind: "painting", focus: "55% 45%",
    caption: "Ivan Kramskoi, Christ in the Wilderness, 1872. Oil painting, an artist's imagining.",
    alt: "Painting of a solitary man in a dark cloak seated on a stone in a barren, rocky wilderness at dawn, hands clasped.",
    theme: "Discipline, perseverance and self-discovery." },
  samaritan: { id: "samaritan", src: vangogh, kind: "painting", focus: "50% 45%",
    caption: "Vincent van Gogh, The Good Samaritan (after Delacroix), 1890. Oil painting.",
    alt: "Painting in thick, swirling brushstrokes of a man lifting a wounded traveller onto a horse on a mountain road.",
    theme: "Love, compassion and service." },
  galilee: { id: "galilee", src: galilee, kind: "photograph", focus: "40% 70%",
    caption: "Sunrise over the Sea of Galilee. Photograph by Grant Barclay, CC BY 2.0.",
    alt: "Photograph of the sun rising over the Sea of Galilee, its light a gold path on the water, a single boat at anchor.",
    theme: "Peace, reflection and stillness." },
  road: { id: "road", src: appian, kind: "photograph", focus: "50% 60%",
    caption: "The Appian Way near Casal Rotondo. Photograph by Livioandronico2013, CC BY-SA 4.0.",
    alt: "Photograph of Roman paving stones running straight between umbrella pines and ruined tombs.",
    theme: "The way (URHA): the road as a sequence of stages." },
  map: { id: "map", src: peutinger, kind: "map", focus: "50% 40%",
    caption: "Tabula Peutingeriana (facsimile by Konrad Miller, 1887), Lazio section. CC BY-SA 3.0.",
    alt: "Section of a Roman road map with roads, stations and distances drawn in red and brown.",
    theme: "An itinerary drawn as stations." },
  leaf: { id: "leaf", src: syriacLeaf, kind: "manuscript", focus: "50% 25%",
    caption: "Syriac liturgical manuscript, 11th century. Public domain.",
    alt: "A worn manuscript leaf with two columns of brown Syriac script and passages in red ink.",
    theme: "Ancient manuscripts: knowledge and truth." },
  codex: { id: "codex", src: barhebraeus, kind: "manuscript", focus: "70% 40%",
    caption: "Manuscript of Barhebraeus, Syriac, 13th-century author. Public domain.",
    alt: "An open Syriac manuscript with dense script, red rubrics and an interlaced headpiece.",
    theme: "The pursuit of wisdom." },
  end: { id: "end", src: brindisi, kind: "photograph", focus: "50% 40%",
    caption: "The column at Brindisi, end of the Appian Way, at night. Photograph by Livioandronico2013, CC BY-SA 4.0.",
    alt: "A lit column at the top of a wide stone stair at night.",
    theme: "The destination of the road." },
} satisfies Record<string, Artwork>;

export type ArtId = keyof typeof ART;
