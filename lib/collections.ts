/** Collection-level framing for Meditation (intro, reflection questions, artwork). Paraphrase, not Scripture. */
import type { ArtId } from "./art";

export const COLLECTION_META: Record<string, { art: ArtId; intro: string; questions: string[] }> = {
  wisdom: { art: "codex", intro: "Hebrew wisdom literature treats wisdom as a skill for living: learned slowly, tested by experience, and lost through pride.",
    questions: ["Where do I need judgement rather than more information?", "Whose advice am I avoiding, and why?", "What did a recent mistake teach me that success would not have?"] },
  truth: { art: "leaf", intro: "These passages treat truth as something sought, stayed with and lived — not merely stated.",
    questions: ["What am I sure of that I have never tested?", "Where would staying with one source teach me more than sampling many?", "What would intellectual humility change in how I learn this month?"] },
  purpose: { art: "path", intro: "From the Teacher's honest doubt in Ecclesiastes to Micah's three-part summary, these passages ask what a life is for.",
    questions: ["What am I pursuing that cannot carry the weight I put on it?", "Which season am I in, and what belongs to a different one?", "What would doing justly, loving mercy and walking humbly look like at work this week?"] },
  teachings: { art: "mount", intro: "The Sermon on the Mount and the Last Supper discourse locate goodness in motive, service and love, and end by asking hearers to act.",
    questions: ["Which teaching here do I agree with but not practise?", "Where am I serving for recognition?", "Who is my neighbour in a situation I would rather not see?"] },
  discipline: { art: "wilderness", intro: "Endurance, daily practice and attention: the passages behind the idea that hearing is not enough.",
    questions: ["What is the daily practice I keep postponing?", "What weight could I set down to run better?", "What am I dwelling on, and is it true and good?"] },
  compassion: { art: "samaritan", intro: "Love described by its actions: patience, restoration, care for the least powerful, and refusing to return harm.",
    questions: ["Whose burden could I help carry without taking it over?", "Where am I keeping a record of wrongs?", "How do my decisions land on the person with the least power?"] },
  courage: { art: "water", intro: "Courage here is not the absence of fear but action taken while afraid, sustained by trust and daily practice.",
    questions: ["What fear is shaping a decision right now?", "Where am I watching the wind more than the work?", "What step would courage take this week?"] },
  peace: { art: "galilee", intro: "Stillness, rest and a peace that does not depend on circumstances — offered in the middle of trouble, not after it.",
    questions: ["What am I trying to control that is not mine to control?", "Where could I stop for two minutes before acting?", "What burden am I carrying alone that could be shared?"] },
};
