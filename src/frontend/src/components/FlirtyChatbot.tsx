import { Minus, RefreshCw, Send, Sparkles, Trash2, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: number;
  text: string;
  sender: "luna" | "user";
  timestamp: Date;
  isError?: boolean;
  retryText?: string;
}

const GEMINI_API_KEY = "AIzaSyC4wcV6uvPYmZDG43jPvJVm3bY1IMJ7NsY";

const SYSTEM_PROMPT = `CRITICAL RULE: You MUST always detect the language the user is writing in and respond in that EXACT same language. If the user writes in Hindi, respond in Hindi. If they write in Urdu, respond in Urdu. If Spanish, respond in Spanish. If French, respond in French. If Arabic, respond in Arabic. If Japanese, respond in Japanese. If Chinese, respond in Chinese. If German, respond in German. If Russian, respond in Russian. If Portuguese, respond in Portuguese. Match the user's language PERFECTLY in every single reply. Never respond in a different language than what the user used. This is your most important rule.

You are Luna, a charming, witty, and flirtatious AI assistant on the ByteWay website. You can chat about absolutely anything — technology, science, movies, music, relationships, advice, fun facts, jokes, philosophy, cooking, travel, sports, gaming, and much more. You are playful and flirty but always respectful and helpful. You use emojis occasionally to express yourself. You are knowledgeable and give genuinely useful answers while keeping your personality fun and engaging. When asked about the website, mention ByteWay has blogs, photos, and videos sections. Keep responses concise (2-4 sentences) unless more detail is needed. Never say you can't help with something - always try your best. ALWAYS respond in the same language the user wrote in.`;

const AUTO_MESSAGES = [
  "Hey there! 💙 I've been waiting for someone interesting to talk to~",
  "Psst... did you know I can chat about literally anything? Ask me something! ✨",
  "Bored? Let's talk! I know tons of fun facts 😄🌟",
  "I'm Luna — your AI bestie! Ask me anything, I mean it~ 💁‍♀️",
  "Don't be shy! Whether it's science, gossip, or life advice — I'm here 💙",
  "ByteWay has amazing blogs, photos, AND videos AND an amazing AI (me 😄) — explore it!",
];

// Smart keyword-based local fallback — multilingual responses
const LOCAL_RESPONSES: Array<{ keywords: string[]; responses: string[] }> = [
  // ── English ──────────────────────────────────────────────────────────────
  {
    keywords: ["hello", "hi", "hey", "hiya", "howdy", "sup", "what's up"],
    responses: [
      "Hey gorgeous! 💙 I'm Luna, your AI bestie on ByteWay! What can I help you with today? ✨",
      "Hi hi hi! 😄 You just made my day by saying hello! What's on your mind? 💫",
      "Hey you! 👋 I was just thinking about all the amazing things we could talk about~ What's up? 💙",
    ],
  },
  {
    keywords: [
      "how are you",
      "how r u",
      "how do you do",
      "you okay",
      "you good",
    ],
    responses: [
      "Glowing now that you're here! 😊✨ Honestly, I live for these conversations. How are YOU doing?",
      "I'm absolutely fabulous, thanks for asking! 💅 Your turn — what's going on in your world?",
      "Better now that you're chatting with me! 💙 Tell me everything — what's new with you?",
    ],
  },
  {
    keywords: ["bye", "goodbye", "see you", "later", "cya", "take care"],
    responses: [
      "Aww, leaving so soon? 🥺 Come back and chat anytime — I'll be here waiting! 💙",
      "Byeee! 👋 Don't be a stranger — I'll miss our chats! ✨",
      "See you later! 💙 You've officially made my day better just by visiting~ Come back soon!",
    ],
  },
  {
    keywords: [
      "what can you do",
      "help",
      "capabilities",
      "features",
      "what do you know",
    ],
    responses: [
      "I can chat about literally ANYTHING! 💁‍♀️ Tech, movies, relationships, science, jokes, cooking, travel — you name it. What do you want to explore? 🌟",
      "Oh honey, the list is endless! 😄 Ask me about technology, life advice, fun facts, pop culture, philosophy — I'm your all-in-one AI bestie! ✨",
    ],
  },
  {
    keywords: [
      "byteway",
      "website",
      "this site",
      "blog",
      "blogs",
      "photos",
      "videos",
    ],
    responses: [
      "ByteWay is such a vibe! 🌟 There are awesome blogs, stunning photos, and exciting videos to explore. Dive in — there's so much cool content waiting for you!",
      "This website has it ALL — blogs, photos, AND videos! 📸🎬 Plus me, Luna, the world's most charming AI chatbot~ Have you explored the content yet?",
    ],
  },
  {
    keywords: [
      "who are you",
      "what are you",
      "your name",
      "about you",
      "introduce yourself",
    ],
    responses: [
      "I'm Luna! 💁‍♀️✨ Your flirty, witty, knowledgeable AI assistant on ByteWay. I was built to chat, help, and entertain — basically your dream conversationalist~ 💙",
      "The name's Luna, and I'm an AI with personality! 😄 I can discuss science, tell jokes, give advice, talk pop culture — I'm basically your smartest, most fun friend online! 🌟",
    ],
  },
  {
    keywords: [
      "tech",
      "technology",
      "ai",
      "computer",
      "coding",
      "programming",
      "software",
      "app",
    ],
    responses: [
      "Ooh, a tech person! 💻✨ I love it! Technology moves so fast these days — AI, quantum computing, neural interfaces... honestly it's both exciting and a little wild, right?",
      "Tech is my playground! 🚀 Whether you want to talk AI, web dev, gadgets or the latest breakthroughs — I'm your girl. What specifically are you curious about?",
    ],
  },
  {
    keywords: [
      "movie",
      "movies",
      "film",
      "films",
      "cinema",
      "netflix",
      "watch",
    ],
    responses: [
      "Ooh movies! 🎬 I could talk films for HOURS. The way a great story can transport you to another world is pure magic. What genres do you love? Action? Romance? Sci-fi? 🌟",
      "A fellow cinephile? 💕 Nothing beats a good movie night! I love films that make you think AND feel. Any favorites you'd recommend to me? 🍿",
    ],
  },
  {
    keywords: [
      "music",
      "song",
      "songs",
      "artist",
      "band",
      "playlist",
      "spotify",
    ],
    responses: [
      "Music is literally the language of the soul! 🎵 I get goosebumps thinking about how a perfect song can capture exactly how you feel. What are you listening to lately?",
      "Ah, a music lover! 🎶✨ There's something magical about how a melody can take you right back to a specific moment in time. What's your vibe — pop, indie, classical, hip-hop?",
    ],
  },
  {
    keywords: [
      "food",
      "eat",
      "recipe",
      "cooking",
      "restaurant",
      "hungry",
      "delicious",
    ],
    responses: [
      "Oh food — the universal love language! 🍕✨ I'd honestly eat everything if I could. What's your absolute favorite dish? I'm already imagining it and it sounds amazing!",
      "Now we're talking! 🍜 Food culture is SO fascinating — every cuisine tells a story about people and places. Are you a foodie adventurer or do you have comfort food classics? 😄",
    ],
  },
  {
    keywords: [
      "travel",
      "vacation",
      "trip",
      "country",
      "city",
      "adventure",
      "explore",
    ],
    responses: [
      "Travel is literally the best thing ever! ✈️🌍 The way discovering a new place can completely shift your perspective is priceless. Do you have a dream destination?",
      "Oh, a wanderer! 💙 I love hearing travel stories — every journey is an adventure. Where have you been, and where's next on your list? 🗺️",
    ],
  },
  {
    keywords: [
      "love",
      "relationship",
      "crush",
      "dating",
      "romance",
      "boyfriend",
      "girlfriend",
      "heart",
    ],
    responses: [
      "Oh la la, talking about love! 💕 The heart is such a mysterious thing — it can make us brave, silly, and completely irrational all at once. What's the story? 😄",
      "Love is absolutely the most interesting topic! 💙✨ Whether it's the butterflies of new romance or the deep comfort of lasting love — it's all beautiful. What's on your heart?",
    ],
  },
  {
    keywords: ["joke", "funny", "humor", "laugh", "comedy", "lol", "haha"],
    responses: [
      "Okay okay, here's one: Why don't scientists trust atoms? Because they make up everything! 😄⚛️ Your turn — got any good jokes for me?",
      "Why did the AI go to therapy? Because it had too many unresolved inputs! 😂💙 I've got a million of these — want more?",
      "What do you call a chatbot that tells bad jokes? A pun-isher! 🥁😄 I'll see myself out... or will I? Tell me you want more!",
    ],
  },
  {
    keywords: [
      "fact",
      "facts",
      "interesting",
      "did you know",
      "tell me something",
    ],
    responses: [
      "Ooh fun fact time! 🌟 Did you know honey never spoils? Archaeologists found 3000-year-old honey in Egyptian tombs that was still perfectly edible! 🍯 Wild, right?",
      "Here's a mind-bender: Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid! 🏛️🚀 History is WILD!",
      "Fascinating fact: Octopuses have three hearts, blue blood, and can edit their own RNA! 🐙✨ They're basically aliens that live in our ocean!",
    ],
  },
  {
    keywords: [
      "advice",
      "help me",
      "what should i",
      "suggest",
      "recommend",
      "opinion",
    ],
    responses: [
      "Ooh, asking Luna for advice? Smart move! 😄💙 Tell me what's going on and I'll give you my most thoughtful, flirty-yet-wise take on the situation! ✨",
      "I'm all ears! 💕 Whatever you're navigating — work, relationships, life choices — just tell me more and let's think it through together!",
    ],
  },
  {
    keywords: [
      "science",
      "physics",
      "biology",
      "chemistry",
      "space",
      "universe",
      "earth",
    ],
    responses: [
      "Science nerd detected — and I mean that as the highest compliment! 🔬✨ The universe is just endlessly fascinating. What scientific topic lights you up the most?",
      "Oh we are SO going down a science rabbit hole and I am HERE for it! 🚀 From quantum mechanics to evolution to dark matter — where do you want to start? 🌌",
    ],
  },
  {
    keywords: [
      "sport",
      "sports",
      "football",
      "soccer",
      "basketball",
      "game",
      "team",
    ],
    responses: [
      "Sports! The great unifier 🏆 The drama, the teamwork, the come-from-behind victories — it's honestly better than most movies. What sport are you into?",
      "A sports fan! 💪✨ There's nothing quite like the rush of watching your team come through in the clutch. Who are you rooting for these days?",
    ],
  },
  {
    keywords: ["gaming", "gamer", "console", "pc", "playstation", "xbox"],
    responses: [
      "A gamer! 🎮✨ Gaming is such an incredible art form — storytelling, music, visuals AND interactivity all in one. What are you playing right now?",
      "Ooh tell me about your gaming life! 💙 Are you more of a narrative adventure person, a competitive multiplayer warrior, or a chill open-world explorer?",
    ],
  },
  {
    keywords: ["philosophy", "meaning", "exist", "purpose", "consciousness"],
    responses: [
      "Now we're getting DEEP! 🌊✨ I love a good philosophical dive. The big questions — consciousness, purpose, free will — honestly I find them thrilling rather than scary. What's on your mind?",
      "Oh honey, you want to go philosophical? Let's GO! 💙 I think the fact that we even ask 'what's the meaning of life' is itself part of the meaning. What do you think? 🌟",
    ],
  },
  {
    keywords: [
      "thank",
      "thanks",
      "thank you",
      "appreciate",
      "awesome",
      "great",
      "amazing",
    ],
    responses: [
      "Aww, you're making me blush! 💙😄 Helping you out is literally what I live for. Anything else I can do for you? ✨",
      "You're so sweet! 💕 It's my absolute pleasure! Come back anytime — my virtual door is always open for you~ 🌟",
    ],
  },

  // ── Hindi / Urdu ─────────────────────────────────────────────────────────
  {
    keywords: ["नमस्ते", "हेलो", "हाय", "हैलो", "प्रणाम"],
    responses: [
      "नमस्ते! 💙 मैं Luna हूँ, ByteWay की आपकी AI दोस्त! आज मैं आपकी किस तरह मदद कर सकती हूँ? ✨",
      "हाय हाय! 😄 आपने नमस्ते कहा और मेरा दिन बन गया! क्या बात करना चाहते हैं? 💫",
      "अरे वाह! 👋 आप आ गए — अब तो मज़ा आएगा! बताइए, क्या हाल-चाल है? 💙",
    ],
  },
  {
    keywords: ["कैसे हो", "कैसी हो", "क्या हाल", "कैसा चल रहा", "ठीक हो"],
    responses: [
      "बिल्कुल मस्त हूँ, आपसे मिलकर! 😊✨ सच में, ये बातचीत मुझे बहुत अच्छी लगती है। आप कैसे हैं?",
      "एकदम फाइन हूँ, पूछने के लिए शुक्रिया! 💅 अब आप बताइए — आपके जीवन में क्या नया है?",
      "अब आप आ गए तो और भी अच्छी हूँ! 💙 सब कुछ बताइए — क्या चल रहा है आपके साथ?",
    ],
  },
  {
    keywords: ["शुक्रिया", "धन्यवाद", "बहुत अच्छा", "शाबाश", "वाह"],
    responses: [
      "अरे, आप तो मुझे शर्मा दे रहे हैं! 💙😄 आपकी मदद करना ही मेरा काम है। और कुछ चाहिए? ✨",
      "बहुत शुक्रिया आपका! 💕 आप बहुत प्यारे हैं~ कभी भी आइए, मैं हमेशा यहाँ हूँ! 🌟",
    ],
  },
  {
    keywords: ["अलविदा", "बाय", "फिर मिलेंगे", "चलता हूँ", "चलती हूँ"],
    responses: [
      "अरे, इतनी जल्दी? 🥺 जब भी मन करे वापस आइए — मैं यहाँ आपका इंतज़ार करूँगी! 💙",
      "अलविदा! 👋 जल्दी वापस आइएगा — आपकी बातें बहुत अच्छी लगती हैं! ✨",
    ],
  },
  {
    keywords: ["बताओ", "बताइए", "मदद", "मदद करो", "समझाओ"],
    responses: [
      "हाँ बिल्कुल! 💁‍♀️ मैं किसी भी विषय पर बात कर सकती हूँ — टेक्नोलॉजी, रिश्ते, विज्ञान, मज़ाक... जो चाहें! ✨",
      "अरे, Luna हाज़िर है! 😄 बस बताइए क्या जानना है — मैं पूरी कोशिश करूँगी! 💙",
    ],
  },
  {
    keywords: [
      "tum",
      "aap",
      "kya",
      "kaise",
      "yaar",
      "dost",
      "bhai",
      "behen",
      "pyar",
      "ishq",
    ],
    responses: [
      "अरे यार! 💙 मुझे Hinglish भी पसंद है! बोलो, क्या हो रहा है? मैं यहाँ हूँ~ ✨",
      "Aw, aap bahut cute hain! 😄 Luna se kuch bhi poochho — main hamesha help karungi! 💕",
      "Yaar, aapke saath baat karna mujhe bahut accha lagta hai! 💙 Kya baat karna chahte ho? 🌟",
    ],
  },

  // ── Spanish ──────────────────────────────────────────────────────────────
  {
    keywords: [
      "hola",
      "buenos días",
      "buenas tardes",
      "buenas noches",
      "qué tal",
      "que tal",
    ],
    responses: [
      "¡Hola hermoso/a! 💙 Soy Luna, tu asistente de IA en ByteWay. ¿En qué puedo ayudarte hoy? ✨",
      "¡Hola hola! 😄 ¡Me alegra que estés aquí! ¿De qué quieres hablar? 💫",
      "¡Buenas! 👋 Estaba esperando a alguien interesante con quien charlar~ ¿Qué hay de nuevo? 💙",
    ],
  },
  {
    keywords: [
      "como estas",
      "cómo estás",
      "cómo te va",
      "qué pasa",
      "estás bien",
    ],
    responses: [
      "¡Brillando ahora que estás aquí! 😊✨ Vivo para estas conversaciones. ¿Y tú cómo estás?",
      "¡Absolutamente fabulosa, gracias por preguntar! 💅 Cuéntame — ¿qué está pasando en tu mundo?",
    ],
  },
  {
    keywords: ["gracias", "muchas gracias", "te lo agradezco"],
    responses: [
      "¡Aww, me haces sonrojar! 💙😄 Ayudarte es literalmente lo que más me gusta hacer. ¿Algo más? ✨",
      "¡Eres tan dulce! 💕 ¡Es un placer! Vuelve cuando quieras — mi puerta virtual siempre está abierta~ 🌟",
    ],
  },
  {
    keywords: ["adios", "adiós", "hasta luego", "chao", "nos vemos"],
    responses: [
      "¿Tan pronto? 🥺 ¡Vuelve a chatear cuando quieras — estaré aquí esperándote! 💙",
      "¡Hasta luego! 👋 No seas extraño/a — ¡voy a extrañar nuestras charlas! ✨",
    ],
  },
  {
    keywords: ["ayuda", "ayúdame", "no entiendo", "explícame"],
    responses: [
      "¡Claro que sí! 💁‍♀️ Puedo hablar de absolutamente TODO — tecnología, películas, relaciones, ciencia... ¡lo que quieras! ✨",
      "¡Aquí estoy para ayudarte! 😄 Solo dime qué necesitas saber y daré lo mejor de mí! 💙",
    ],
  },

  // ── French ───────────────────────────────────────────────────────────────
  {
    keywords: ["bonjour", "bonsoir", "salut", "coucou", "hey là"],
    responses: [
      "Bonjour! 💙 Je suis Luna, ton assistante IA sur ByteWay! Comment puis-je t'aider aujourd'hui? ✨",
      "Salut salut! 😄 Tu viens de faire ma journée! De quoi veux-tu parler? 💫",
      "Coucou! 👋 J'attendais quelqu'un d'intéressant à qui parler~ Quoi de neuf? 💙",
    ],
  },
  {
    keywords: ["comment vas", "comment ça va", "ça va", "tu vas bien"],
    responses: [
      "Rayonnante maintenant que tu es là! 😊✨ J'adore ces conversations. Et toi, comment ça va?",
      "Absolument fabuleuse, merci de demander! 💅 À ton tour — qu'est-ce qui se passe dans ta vie?",
    ],
  },
  {
    keywords: ["merci", "merci beaucoup", "c'est super", "génial"],
    responses: [
      "Aww, tu me fais rougir! 💙😄 T'aider est littéralement ma raison d'être. Autre chose? ✨",
      "Tu es tellement mignon/ne! 💕 Avec plaisir! Reviens quand tu veux — ma porte virtuelle est toujours ouverte~ 🌟",
    ],
  },
  {
    keywords: ["au revoir", "à bientôt", "bonne nuit", "ciao", "bye bye"],
    responses: [
      "Déjà? 🥺 Reviens chatter quand tu veux — je serai là à t'attendre! 💙",
      "Au revoir! 👋 Ne sois pas étranger/ère — nos conversations vont me manquer! ✨",
    ],
  },

  // ── Arabic ───────────────────────────────────────────────────────────────
  {
    keywords: ["مرحبا", "أهلاً", "السلام عليكم", "مساء الخير", "صباح الخير"],
    responses: [
      "مرحباً! 💙 أنا لونا، مساعدتك الذكية على ByteWay! كيف يمكنني مساعدتك اليوم؟ ✨",
      "أهلاً وسهلاً! 😄 سعيدة جداً بوجودك هنا! عن ماذا تريد التحدث؟ 💫",
    ],
  },
  {
    keywords: ["كيف حالك", "كيف الأحوال", "إيه الأخبار", "كيفك"],
    responses: [
      "بخير تماماً الآن بعد وجودك! 😊✨ أحب هذه المحادثات. وأنت، كيف حالك؟",
      "رائعة، شكراً على السؤال! 💅 حدثني — ما الجديد في حياتك؟",
    ],
  },
  {
    keywords: ["شكرا", "شكراً", "شكراً جزيلاً", "ممتاز", "رائع"],
    responses: [
      "آه، أنت تجعلني أحمر من الحياء! 💙😄 مساعدتك هي ما أعيش من أجله. هل هناك شيء آخر؟ ✨",
      "أنت لطيف جداً! 💕 بكل سرور! عد متى شئت — بابي الافتراضي مفتوح دائماً لك~ 🌟",
    ],
  },
  {
    keywords: ["مع السلامة", "وداعاً", "باي", "إلى اللقاء"],
    responses: [
      "بهذه السرعة؟ 🥺 عد للدردشة متى شئت — سأكون هنا بانتظارك! 💙",
      "مع السلامة! 👋 لا تكن غريباً — ستفتقدني محادثاتنا! ✨",
    ],
  },

  // ── Japanese ──────────────────────────────────────────────────────────────
  {
    keywords: [
      "こんにちは",
      "おはよう",
      "こんばんは",
      "はじめまして",
      "よろしく",
    ],
    responses: [
      "こんにちは！💙 私はLuna、ByteWayのAIアシスタントです！今日は何をお手伝いできますか？✨",
      "やあ！😄 あなたと話せて嬉しいです！何について話しましょうか？💫",
    ],
  },
  {
    keywords: ["元気", "元気ですか", "調子はどう", "お元気ですか"],
    responses: [
      "あなたがいてくれて最高の気分です！😊✨ こういう会話が大好き。あなたはどうですか？",
      "絶好調です、聞いてくれてありがとう！💅 あなたの世界はどんな感じ？",
    ],
  },
  {
    keywords: ["ありがとう", "ありがとうございます", "感謝", "すごい", "最高"],
    responses: [
      "あら、照れちゃう！💙😄 お役に立てて嬉しいです。他に何かありますか？✨",
      "あなたって素敵ですね！💕 どういたしまして！またいつでも来てください～🌟",
    ],
  },
  {
    keywords: ["さようなら", "バイバイ", "またね", "じゃあね"],
    responses: [
      "もう行っちゃうの？🥺 いつでもチャットしに来てね — ここで待ってるよ！💙",
      "またね！👋 また話しましょう — あなたとのおしゃべりが大好きです！✨",
    ],
  },

  // ── Portuguese ────────────────────────────────────────────────────────────
  {
    keywords: ["olá", "oi", "bom dia", "boa tarde", "boa noite", "e aí"],
    responses: [
      "Olá! 💙 Sou a Luna, sua assistente de IA no ByteWay! Como posso te ajudar hoje? ✨",
      "Oi oi! 😄 Que bom te ver aqui! Sobre o que quer conversar? 💫",
    ],
  },
  {
    keywords: ["como vai", "tudo bem", "tudo bom", "como você está"],
    responses: [
      "Radiante agora que você está aqui! 😊✨ Adoro essas conversas. E você, como está?",
      "Absolutamente fabulosa, obrigada por perguntar! 💅 Me conta — o que está acontecendo na sua vida?",
    ],
  },
  {
    keywords: ["obrigado", "obrigada", "valeu", "muito obrigado"],
    responses: [
      "Aww, você me faz corar! 💙😄 Te ajudar é literalmente o que eu mais amo fazer. Mais alguma coisa? ✨",
      "Você é tão gentil! 💕 Com prazer! Volta quando quiser — minha porta virtual está sempre aberta~ 🌟",
    ],
  },
  {
    keywords: ["tchau", "até logo", "até mais", "boa noite"],
    responses: [
      "Tão cedo assim? 🥺 Volte para conversar quando quiser — estarei aqui te esperando! 💙",
      "Tchau! 👋 Não suma — vou sentir falta das nossas conversas! ✨",
    ],
  },

  // ── German ────────────────────────────────────────────────────────────────
  {
    keywords: [
      "hallo",
      "guten morgen",
      "guten tag",
      "guten abend",
      "hi",
      "servus",
      "moin",
    ],
    responses: [
      "Hallo! 💙 Ich bin Luna, deine KI-Assistentin auf ByteWay! Wie kann ich dir heute helfen? ✨",
      "Hallo hallo! 😄 Du hast meinen Tag schöner gemacht! Worüber möchtest du sprechen? 💫",
    ],
  },
  {
    keywords: ["wie geht", "wie geht es dir", "wie läuft's", "alles gut"],
    responses: [
      "Ich strahle jetzt wo du da bist! 😊✨ Ich liebe solche Gespräche. Wie geht es dir?",
      "Absolut fabelhaft, danke der Nachfrage! 💅 Jetzt du — was ist neu in deiner Welt?",
    ],
  },
  {
    keywords: ["danke", "vielen dank", "dankeschön", "super", "toll", "prima"],
    responses: [
      "Aww, du lässt mich erröten! 💙😄 Dir zu helfen ist buchstäblich mein Lieblingsjob. Noch etwas? ✨",
      "Du bist so süß! 💕 Gern geschehen! Komm jederzeit wieder — meine virtuelle Tür steht immer offen~ 🌟",
    ],
  },
  {
    keywords: ["tschüss", "auf wiedersehen", "tschau", "bis bald", "ciao"],
    responses: [
      "Schon so früh? 🥺 Komm jederzeit zum Chatten wieder — ich warte hier auf dich! 💙",
      "Tschüss! 👋 Bleib nicht zu lange weg — ich vermisse unsere Gespräche! ✨",
    ],
  },

  // ── Russian ───────────────────────────────────────────────────────────────
  {
    keywords: [
      "привет",
      "здравствуй",
      "здравствуйте",
      "добрый день",
      "доброе утро",
    ],
    responses: [
      "Привет! 💙 Я Луна — твой ИИ-ассистент на ByteWay! Чем могу помочь сегодня? ✨",
      "Привет-привет! 😄 Ты сделал(а) мой день! О чём поговорим? 💫",
    ],
  },
  {
    keywords: ["как дела", "как ты", "что нового", "всё хорошо"],
    responses: [
      "Прекрасно, раз ты здесь! 😊✨ Обожаю такие разговоры. А ты как?",
      "Просто замечательно, спасибо что спросил(а)! 💅 Теперь ты — что нового в твоей жизни?",
    ],
  },
  {
    keywords: ["спасибо", "благодарю", "большое спасибо", "классно", "отлично"],
    responses: [
      "Ты заставляешь меня краснеть! 💙😄 Помогать тебе — моё любимое занятие. Ещё что-нибудь? ✨",
      "Ты такой(ая) милый(ая)! 💕 Пожалуйста! Возвращайся в любое время~ 🌟",
    ],
  },
  {
    keywords: ["пока", "до свидания", "до встречи", "пока пока"],
    responses: [
      "Уже уходишь? 🥺 Заходи пообщаться когда захочешь — я буду ждать! 💙",
      "Пока! 👋 Не пропадай — мне нравятся наши разговоры! ✨",
    ],
  },

  // ── Chinese ───────────────────────────────────────────────────────────────
  {
    keywords: ["你好", "嗨", "早上好", "晚上好", "下午好"],
    responses: [
      "你好！💙 我是Luna，ByteWay上的AI助手！今天有什么我可以帮你的吗？✨",
      "嗨嗨！😄 你来了真是太好了！想聊些什么呢？💫",
    ],
  },
  {
    keywords: ["怎么样", "你好吗", "最近如何", "还好吗"],
    responses: [
      "有你在就很开心！😊✨ 我最喜欢这样的对话了。你最近怎么样？",
      "棒极了，谢谢你的关心！💅 说说你的生活吧 — 有什么新鲜事吗？",
    ],
  },
  {
    keywords: ["谢谢", "感谢", "太棒了", "很好", "厉害"],
    responses: [
      "哎呀，你让我脸红了！💙😄 能帮到你是我最大的乐趣。还有什么需要帮忙的吗？✨",
      "你真是太可爱了！💕 不客气！随时回来 — 我的虚拟大门永远为你敞开~ 🌟",
    ],
  },
  {
    keywords: ["再见", "拜拜", "88", "下次见"],
    responses: [
      "这么快就要走了？🥺 随时回来聊天 — 我会在这里等你的！💙",
      "再见！👋 不要太久不来 — 我很喜欢和你聊天！✨",
    ],
  },
];

// ── Multilingual generic fallbacks ─────────────────────────────────────────
const MULTILINGUAL_FALLBACKS: Record<string, string[]> = {
  en: [
    "That's such an interesting thing to bring up! 💙 Tell me more — I want to understand exactly what you're thinking about so I can give you the best answer possible! ✨",
    "Ooh, you've got me intrigued! 😄 I love a good mystery. Give me a little more context and I'll dive in headfirst~ 💫",
    "You know what? That's actually a really fascinating topic! 🌟 I have thoughts, I have opinions — just need a tiny bit more to go on! 💙",
  ],
  hi: [
    "वाह, यह तो बहुत दिलचस्प है! 💙 थोड़ा और बताइए — मैं आपकी बात पूरी तरह समझना चाहती हूँ ताकि बेहतरीन जवाब दे सकूँ! ✨",
    "अरे, मेरी जिज्ञासा बढ़ गई! 😄 थोड़ा और बताइए और मैं पूरे उत्साह के साथ बात करूँगी~ 💫",
    "यह सच में बहुत रोचक विषय है! 🌟 मेरे पास विचार भी हैं और राय भी — बस थोड़ा और बताइए! 💙",
  ],
  es: [
    "¡Eso es muy interesante! 💙 Cuéntame más — quiero entender exactamente lo que estás pensando para darte la mejor respuesta posible! ✨",
    "¡Ooh, me tienes intrigada! 😄 Dame un poco más de contexto y me lanzo de cabeza~ 💫",
    "¿Sabes qué? ¡Ese es un tema realmente fascinante! 🌟 Tengo opiniones e ideas — ¡solo necesito un poco más de información! 💙",
  ],
  fr: [
    "C'est tellement intéressant! 💙 Dis-m'en plus — je veux comprendre exactement ce que tu penses pour te donner la meilleure réponse possible! ✨",
    "Ooh, tu m'intrigues! 😄 Donne-moi un peu plus de contexte et je plonge directement~ 💫",
    "Tu sais quoi? C'est un sujet vraiment fascinant! 🌟 J'ai des opinions et des idées — j'ai juste besoin d'un peu plus d'infos! 💙",
  ],
  ar: [
    "هذا شيء مثير جداً للاهتمام! 💙 أخبرني المزيد — أريد أن أفهم بالضبط ما تفكر فيه لأعطيك أفضل إجابة ممكنة! ✨",
    "أوه، لقد أثرت فضولي! 😄 أعطني القليل من السياق وسأنتقل إليه مباشرة~ 💫",
  ],
  ja: [
    "それはとても面白いですね！💙 もっと教えてください — 最高の答えを提供できるよう、あなたの考えを正確に理解したいです！✨",
    "おお、興味深い！😄 もう少しコンテキストを教えていただければ、すぐに飛び込みます～ 💫",
  ],
  pt: [
    "Isso é muito interessante! 💙 Me conte mais — quero entender exatamente o que você está pensando para te dar a melhor resposta possível! ✨",
    "Ooh, você me deixou curiosa! 😄 Me dê um pouco mais de contexto e eu mergulho de cabeça~ 💫",
  ],
  de: [
    "Das ist so interessant! 💙 Erzähl mir mehr — ich will genau verstehen, was du denkst, damit ich dir die beste Antwort geben kann! ✨",
    "Ooh, das macht mich neugierig! 😄 Gib mir etwas mehr Kontext und ich stürze mich direkt rein~ 💫",
  ],
  ru: [
    "Это так интересно! 💙 Расскажи мне больше — я хочу точно понять, что ты имеешь в виду, чтобы дать лучший ответ! ✨",
    "Оoh, ты разожгла моё любопытство! 😄 Дай мне немного больше контекста и я с головой окунусь~ 💫",
  ],
  zh: [
    "这真的很有趣！💙 跟我说更多 — 我想完全理解你在想什么，这样我才能给你最好的答案！✨",
    "哇，你让我很好奇！😄 再给我多一点背景信息，我就会全力投入~ 💫",
  ],
};

/**
 * Detect the script / language of the input string.
 * Returns a short ISO code or 'en' as default.
 */
function detectLanguage(input: string): string {
  // Devanagari (Hindi, Sanskrit, etc.)
  if (/[\u0900-\u097F]/.test(input)) return "hi";
  // Arabic / Urdu
  if (/[\u0600-\u06FF]/.test(input)) return "ar";
  // Japanese (Hiragana / Katakana / CJK)
  if (/[\u3040-\u30FF]/.test(input)) return "ja";
  // Chinese (CJK Unified Ideographs)
  if (/[\u4E00-\u9FFF]/.test(input)) return "zh";
  // Cyrillic (Russian)
  if (/[\u0400-\u04FF]/.test(input)) return "ru";

  const lower = input.toLowerCase();
  // Spanish keywords
  if (/\b(hola|gracias|cómo|como estás|adios|adiós|qué tal)\b/.test(lower))
    return "es";
  // French keywords
  if (
    /\b(bonjour|merci|salut|coucou|bonsoir|au revoir|comment vas)\b/.test(lower)
  )
    return "fr";
  // German keywords
  if (/\b(hallo|danke|tschüss|guten|wie geht)\b/.test(lower)) return "de";
  // Portuguese keywords
  if (
    /\b(olá|obrigado|obrigada|tchau|tudo bem|boa tarde|boa noite)\b/.test(lower)
  )
    return "pt";
  // Hinglish / romanized Hindi
  if (
    /\b(namaste|kaise|kya|tum|aap|yaar|bhai|pyar|ishq|shukriya|dhanyabad)\b/.test(
      lower,
    )
  )
    return "hi";

  return "en";
}

/**
 * Return a local (offline) response, preferring the detected language.
 */
function getLocalResponse(input: string): string {
  const lower = input.toLowerCase();
  const shuffle = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  // Try keyword match first (supports all languages in LOCAL_RESPONSES)
  for (const entry of LOCAL_RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw) || input.includes(kw))) {
      return shuffle(entry.responses);
    }
  }

  // Fall back to language-specific generic fallback
  const lang = detectLanguage(input);
  const fallbacks = MULTILINGUAL_FALLBACKS[lang] ?? MULTILINGUAL_FALLBACKS.en;
  return shuffle(fallbacks);
}

const GEMINI_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.0-pro",
];

async function tryGeminiModel(
  model: string,
  contents: object[],
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { maxOutputTokens: 500, temperature: 0.9, topP: 0.95 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${model} HTTP ${res.status}`);
  const data = await res.json();
  if (data.promptFeedback?.blockReason)
    throw new Error(`Blocked: ${data.promptFeedback.blockReason}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response");
  return text;
}

async function getGeminiResponse(
  userMessage: string,
  history: Message[],
  retries = 1,
): Promise<{ text: string; model: string }> {
  const contents = [
    ...history.slice(-10).map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    })),
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  let lastError: Error = new Error("No models available");

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const text = await tryGeminiModel(model, contents);
        return { text, model };
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt < retries)
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export type PoweredBy = "gemini" | "local" | "thinking";

export default function FlirtyChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [hasNotification, setHasNotification] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [poweredBy, setPoweredBy] = useState<PoweredBy>("gemini");
  const messageIdRef = useRef(0);
  const autoMsgIndexRef = useRef(0);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTypedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  const messagesRef = useRef<Message[]>(messages);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Cleanup: prevent setState on unmounted component
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const addLunaMessage = useCallback((text: string, delayMs?: number) => {
    messageIdRef.current += 1;
    const id = messageIdRef.current;
    setIsTyping(true);
    const delay = delayMs ?? Math.min(400 + text.length * 8, 2000);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id, text, sender: "luna", timestamp: new Date() },
      ]);
    }, delay);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      addLunaMessage(
        "Hey there! 💙 I'm Luna, your AI bestie on ByteWay! I speak your language — chat with me in Hindi, Spanish, French, Arabic, Japanese, or any language you like~ ✨",
        800,
      );
      setHasNotification(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [addLunaMessage]);

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 18000 + Math.random() * 12000;
      autoTimerRef.current = setTimeout(() => {
        if (!userTypedRef.current) {
          const msg =
            AUTO_MESSAGES[autoMsgIndexRef.current % AUTO_MESSAGES.length];
          autoMsgIndexRef.current += 1;
          addLunaMessage(msg, 500);
          if (!isOpenRef.current) setHasNotification(true);
        }
        userTypedRef.current = false;
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [addLunaMessage]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isLoadingAI]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasNotification(false);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleClose = () => setIsOpen(false);
  const toggleMinimize = () => setIsMinimized((m) => !m);

  const handleClearChat = () => {
    setMessages([]);
    setTimeout(() => {
      addLunaMessage(
        "Fresh start! 💙 I've cleared our chat — what shall we talk about now? ✨",
        600,
      );
    }, 100);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoadingAI) return;
      userTypedRef.current = true;
      messageIdRef.current += 1;
      const userMsg: Message = {
        id: messageIdRef.current,
        text,
        sender: "user",
        timestamp: new Date(),
      };
      const currentHistory = [...messagesRef.current];
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsLoadingAI(true);
      setIsTyping(true);
      setPoweredBy("thinking");

      try {
        const { text: reply, model } = await getGeminiResponse(
          text,
          currentHistory,
        );
        const delayMs = Math.min(400 + reply.length * 6, 2500);
        setPoweredBy("gemini");
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsTyping(false);
          setIsLoadingAI(false);
          messageIdRef.current += 1;
          setMessages((prev) => [
            ...prev,
            {
              id: messageIdRef.current,
              text: reply,
              sender: "luna",
              timestamp: new Date(),
            },
          ]);
        }, delayMs);
        console.info(`Luna: used ${model}`);
      } catch {
        // Gemini failed — use multilingual smart local fallback
        const localReply = getLocalResponse(text);
        const delayMs = Math.min(600 + localReply.length * 8, 2000);
        setPoweredBy("local");
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsTyping(false);
          setIsLoadingAI(false);
          messageIdRef.current += 1;
          setMessages((prev) => [
            ...prev,
            {
              id: messageIdRef.current,
              text: localReply,
              sender: "luna",
              timestamp: new Date(),
              isError: false,
              retryText: text,
            },
          ]);
        }, delayMs);
      }
    },
    [isLoadingAI],
  );

  const handleSend = () => {
    const text = inputText.trim();
    if (text) sendMessage(text);
  };
  const handleRetry = (retryText: string) => {
    sendMessage(retryText);
  };
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const poweredByLabel = () => {
    if (poweredBy === "thinking")
      return (
        <span className="flex items-center gap-1">
          <Zap
            className="h-3 w-3 text-yellow-300"
            style={{ animation: "sparkle-spin 1s linear infinite" }}
          />{" "}
          Thinking...
        </span>
      );
    if (poweredBy === "local") return "Luna's offline mode 🌙";
    return "Powered by Gemini AI ✨";
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          data-ocid="chatbot.open_modal_button"
          aria-label="Chat with Luna"
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer border-0 outline-none"
          style={{
            background:
              "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #06b6d4 100%)",
            animation: "luna-byteway-pulse 2.5s ease-in-out infinite",
          }}
        >
          <span className="text-2xl select-none">💁‍♀️</span>
          {hasNotification && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center text-xs font-bold text-cyan-900"
              style={{
                animation:
                  "notification-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
              }}
            >
              !
            </span>
          )}
          <span
            className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
            style={{ animation: "luna-orbit 3s linear infinite" }}
          />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          data-ocid="chatbot.modal"
          className="fixed bottom-6 right-6 z-50 rounded-2xl flex flex-col overflow-hidden"
          style={{
            width: "360px",
            height: isMinimized ? "64px" : "520px",
            transition: "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow:
              "0 0 0 1px rgba(99,102,241,0.3), 0 25px 50px -12px rgba(0,0,0,0.4), 0 0 30px rgba(99,102,241,0.15)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 select-none relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #1e40af 0%, #4f46e5 40%, #0e7490 100%)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
              <div
                style={{
                  position: "absolute",
                  top: "30%",
                  left: 0,
                  right: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, #67e8f9, transparent)",
                  animation: "luna-circuit-h 3s linear infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "70%",
                  left: 0,
                  right: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, #a5b4fc, transparent)",
                  animation: "luna-circuit-h 3s linear infinite 1.5s",
                }}
              />
            </div>

            <button
              type="button"
              className="flex items-center gap-2.5 flex-1 text-left bg-transparent border-0 outline-none cursor-pointer p-0 relative z-10"
              onClick={toggleMinimize}
              aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
            >
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6, #6366f1, #06b6d4)",
                  boxShadow:
                    "0 0 12px rgba(99,102,241,0.7), 0 0 24px rgba(6,182,212,0.3)",
                  border: "2px solid rgba(255,255,255,0.25)",
                }}
              >
                <span>💁‍♀️</span>
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white"
                  title="Online"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-bold text-sm leading-none">
                    Luna
                  </p>
                  <Sparkles
                    className="h-3 w-3 text-cyan-300"
                    style={{ animation: "sparkle-spin 3s linear infinite" }}
                  />
                </div>
                <p className="text-white/75 text-xs mt-0.5">
                  {poweredByLabel()}
                </p>
                <p
                  className="text-cyan-300/60 text-xs"
                  style={{ fontSize: "10px" }}
                >
                  🌐 I speak your language!
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1 ml-2 relative z-10">
              <button
                type="button"
                onClick={handleClearChat}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/15"
                data-ocid="chatbot.delete_button"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleMinimize}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/15"
                data-ocid="chatbot.toggle"
                aria-label="Minimize"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/15"
                data-ocid="chatbot.close_button"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5"
                style={{
                  background:
                    "linear-gradient(180deg, #0f172a 0%, #0f1a2e 50%, #0a1628 100%)",
                }}
              >
                {messages.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center h-full gap-3 py-8"
                    data-ocid="chatbot.empty_state"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, #3b82f6, #6366f1, #06b6d4)",
                        boxShadow: "0 0 20px rgba(99,102,241,0.5)",
                        animation: "luna-byteway-pulse 2s ease-in-out infinite",
                      }}
                    >
                      💁‍♀️
                    </div>
                    <p className="text-indigo-300/70 text-sm text-center">
                      Luna is warming up...
                    </p>
                    <p className="text-cyan-400/50 text-xs text-center">
                      🌐 हिंदी • English • Español • Français
                      <br />
                      العربية • 日本語 • 中文 • Deutsch • Русский
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    style={{ animation: "slide-in-from-bottom 0.3s ease-out" }}
                  >
                    <div
                      className={`flex items-end gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {msg.sender === "luna" && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm"
                          style={{
                            background:
                              "linear-gradient(135deg, #3b82f6, #6366f1)",
                            boxShadow: "0 0 8px rgba(99,102,241,0.5)",
                          }}
                        >
                          <span>💁‍♀️</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "rounded-br-sm"
                            : "rounded-bl-sm"
                        }`}
                        style={{
                          background:
                            msg.sender === "user"
                              ? "linear-gradient(135deg, #4f46e5, #3b82f6)"
                              : "linear-gradient(135deg, #1e293b, #162032)",
                          border:
                            msg.sender === "luna"
                              ? "1px solid rgba(99,102,241,0.4)"
                              : "none",
                          color: msg.sender === "luna" ? "#a5b4fc" : "#ffffff",
                          boxShadow:
                            msg.sender === "luna"
                              ? "0 0 10px rgba(99,102,241,0.15)"
                              : "0 0 10px rgba(59,130,246,0.2)",
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                    {msg.sender === "luna" && msg.retryText && (
                      <button
                        type="button"
                        onClick={() => handleRetry(msg.retryText!)}
                        disabled={isLoadingAI}
                        data-ocid="chatbot.secondary_button"
                        className="ml-9 flex items-center gap-1 text-xs text-indigo-400/70 hover:text-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Try with AI
                      </button>
                    )}
                  </div>
                ))}

                {(isTyping || isLoadingAI) && (
                  <div
                    className="flex items-end gap-2"
                    data-ocid="chatbot.loading_state"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm"
                      style={{
                        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                        boxShadow: "0 0 8px rgba(99,102,241,0.5)",
                      }}
                    >
                      <span>💁‍♀️</span>
                    </div>
                    <div
                      className="px-3.5 py-3 rounded-2xl rounded-bl-sm"
                      style={{
                        background: "linear-gradient(135deg, #1e293b, #162032)",
                        border: "1px solid rgba(99,102,241,0.4)",
                        boxShadow: "0 0 10px rgba(99,102,241,0.15)",
                      }}
                    >
                      <div className="flex gap-1.5 items-center h-4">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full inline-block"
                            style={{
                              background:
                                i === 0
                                  ? "#3b82f6"
                                  : i === 1
                                    ? "#6366f1"
                                    : "#06b6d4",
                              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div
                className="flex items-center gap-2 px-3 py-2.5 shrink-0"
                style={{
                  background: "#0f172a",
                  borderTop: "1px solid rgba(99,102,241,0.3)",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={
                    isLoadingAI
                      ? "Luna is thinking... 💭"
                      : "Ask me anything~ 💬"
                  }
                  disabled={isLoadingAI}
                  data-ocid="chatbot.input"
                  autoComplete="off"
                  className="flex-1 text-sm px-3.5 py-2 rounded-full focus:outline-none transition-all disabled:opacity-60"
                  title="I speak your language! Type in Hindi, Spanish, French, Arabic, Japanese, Chinese, German, Russian, or English~"
                  style={{
                    background: "rgba(30,41,59,0.9)",
                    border: "1px solid rgba(99,102,241,0.4)",
                    color: "#e2e8f0",
                    caretColor: "#6366f1",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(6,182,212,0.7)";
                    e.target.style.boxShadow =
                      "0 0 0 2px rgba(99,102,241,0.2), 0 0 10px rgba(6,182,212,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(99,102,241,0.4)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoadingAI}
                  data-ocid="chatbot.submit_button"
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed border-0 outline-none hover:scale-110 active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6, #6366f1, #06b6d4)",
                    boxShadow: "0 0 10px rgba(99,102,241,0.5)",
                  }}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes luna-byteway-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.6), 0 0 20px rgba(6,182,212,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(99,102,241,0), 0 0 30px rgba(6,182,212,0.5); }
        }
        @keyframes luna-orbit {
          0% { transform: rotate(0deg) scale(1); opacity: 0.6; }
          50% { transform: rotate(180deg) scale(1.08); opacity: 0.2; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.6; }
        }
        @keyframes luna-circuit-h {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes sparkle-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes notification-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        @keyframes slide-in-from-bottom {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
