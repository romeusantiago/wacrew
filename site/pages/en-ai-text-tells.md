---
lang: en
path: /en/ai-text-tells/
slug: ai-text-tells
title: The tells that make AI text read like a bot, and a linter that catches them
seoTitle: "AI text tells: why your bot sounds like a bot, and how to lint it"
description: The phrases, punctuation and habits that give AI-written messages away, why they matter in support and chat, and an open-source linter that flags them before you hit send.
keyword: ai text tells
date: 2026-11-14
---

You can spot it in the first line. "Great question!" Then an em dash. Then "seamless", "robust", "ensuring that". It ends with "Let me know if you have any other questions!" The answer may be correct, but the reader already knows who wrote it, and in a support chat or a client email that costs trust.

I build [WACrew](/en/), an open-source WhatsApp agent where every reply goes through a review before it is sent. The generic part of that review is now a small library, [botsmell](https://github.com/sumioshi/botsmell). This post lists what it looks for and why.

## Why bother

A detector tells you whether a model wrote something. That is not the useful question when you ship an agent. You already know a model wrote it. The useful question is whether the person on the other side will feel like they are talking to a template. That comes down to habits, and habits can be listed.

The habits also compound. One em dash is nothing. An em dash, an opening compliment and a closing offer of help in a three-line message reads like a form letter. So botsmell gives each habit a weight and fails the text when the sum crosses a threshold, instead of failing on any single hit.

## Openings

**Praising the question.** "Great question!", "What a great point", "Certainly!". People rarely compliment a question before answering it in chat. Open with the answer.

**Announcing eagerness.** "I'd be happy to help", "Happy to help!". The help is the message. Skip the announcement.

**Receipts.** "Thanks for reaching out!", "I got your message about the invoice". Replying already proves you read it. Start with what you did.

## Closings

**The reflex offer.** "Let me know if you have any other questions", "Feel free to reach out", "Hope this helps!". If there is a real next step, ask for it. Otherwise end on the fact.

**Canned empathy.** "I completely understand your frustration", "Rest assured", "We appreciate your patience". Name the actual problem in a few words and move to the fix.

## Punctuation and rhythm

**The em dash.** One of the most common signs of generated text. Humans in chat use a comma or a period, or they send a new message. botsmell also flags a spaced hyphen used the same way.

**The colon intro.** "Here's the thing: the cache was stale." Split it into two sentences. Times, URLs and labels like `e.g.:` or `fix(api):` are ignored.

**The rule of three.** "Fast, reliable and secure." Two items, or one per sentence, read more like a person.

**"Not only X but also Y"** and **"It's not X, it's Y"**. Rhetorical frames that rarely appear in a quick reply. State the point directly.

## Vocabulary

Some words show up far more often in model output than in human writing: delve, tapestry, seamless, leverage, robust, pivotal, holistic, "in today's fast-paced world". None of them is wrong. Several in one message is a pattern.

A related habit is the **padded -ing tail**: "We updated the config, ensuring that requests are retried." End the sentence, then say the effect with a direct verb: "We updated the config. Requests retry now."

## Apologies and blame

In support, how you talk about a mistake matters more than the mistake. The common failures:

- **Confession**: "my bad", "my mistake", "sorry for the inconvenience".
- **Accident stories**: "I accidentally", "I forgot to", "it slipped through". They describe intent instead of impact.
- **Drama**: "huge issue", "luckily we caught it".
- **Repeated apologies**: two "sorry" in one message.
- **Hedges**: "I think", "just wanted to", "tiny issue".

The suggestion botsmell gives is the same for most of them: state what happened in the system and what changed. "Exports were missing the last row; they include it now."

## Chat formatting

In a chat bubble, Markdown shows up as literal asterisks, and bullet lists look pasted from a document. botsmell flags bold, headings, bullets and emoji used as bullets in chat mode, and skips them in prose mode for emails and docs.

## Context: repetition and the clock

Two checks need more than the message itself:

- **Repetition.** Pass your previous messages and botsmell blocks an identical message and flags the same opening twice in a row. Agents love to start every reply the same way.
- **Greeting vs. time.** Pass when the message will be read and the reader's time zone, and "good morning" at 3 p.m. gets flagged. This matters when an agent queues a message for later.

## Every hit comes with a fix

Telling a model what not to write tends to make it write exactly that. So each rule returns a positive suggestion: "open with the answer", "use a comma, a period or a new message". Feed those back and ask for a rewrite:

```ts
import { check } from "botsmell";

let draft = await llm.reply(ticket);
for (let i = 0; i < 3; i++) {
  const r = check(draft);
  if (r.ok) break;
  draft = await llm.rewrite(draft, r.hits.map((h) => h.suggestion));
}
```

## A small sanity check

Before publishing, I ran it on 13 short human messages in English and Portuguese ("pushed the fix, totals match now", "not today, but I can do it Monday", "sorry for the late reply, was on a call") and 6 typical assistant replies. All 13 human messages passed and all 6 assistant replies failed. That is a tiny sample, not a benchmark, but it is the property that matters: the rules should rarely fire on a person.

## Try it

```bash
npx botsmell "Great question! I'd be happy to help."
```

It also runs as a Claude Code hook that blocks bot-sounding commit messages and PR text, and as a GitHub Action that checks pull requests. The rules are plain regular expressions, there are no dependencies and no API keys, and new rules or languages are welcome.

- botsmell on [GitHub](https://github.com/sumioshi/botsmell) and [npm](https://www.npmjs.com/package/botsmell)
- WACrew, the [open-source WhatsApp AI agent](/en/whatsapp-ai-agent/) it came from
