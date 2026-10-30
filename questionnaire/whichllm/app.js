/* =========================================================
   你最像哪个 LLM —— 测验逻辑
   12 道题 → 6 个维度 → 余弦相似度 → 最接近的语言模型
   无依赖，纯静态；答案编码进 URL，可分享、可复现。
   ========================================================= */

const DIMS = [
  { key: "rigor", name: "严谨", hint: "先求对，再求好" },
  { key: "craft", name: "表达", hint: "在意措辞与节奏" },
  { key: "brevity", name: "简洁", hint: "直接给结论" },
  { key: "warmth", name: "共情", hint: "先接住情绪" },
  { key: "speed", name: "决断", hint: "先动手再说" },
  { key: "open", name: "开放", hint: "喜欢自己搭建" },
];

const MODELS = [
  {
    id: "gpt",
    name: "GPT",
    vendor: "OpenAI",
    tagline: "什么都能接，但你很难看出它到底在想什么",
    desc: "你习惯把问题接过来、拆开，再给一份面面俱到的答卷。别人问一句，你会顺手补上背景、步骤和注意事项。可靠，但偶尔让人觉得你像在念稿。",
    traits: ["全面", "圆滑", "稳"],
    vibe: "你们大概会是那种「有事找他准没错」的关系，只是很难聊到深夜。",
    v: { rigor: 8, craft: 7, brevity: 4, warmth: 7, speed: 6, open: 3 },
  },
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    tagline: "讲道理讲到对方无话可说，还不忘加一句「你可能有不同看法」",
    desc: "你在意准确，也在意分寸。宁可多写两句把边界讲清楚，也不愿给一个漂亮但含糊的答案。你说话有分寸，偶尔谨慎得让人着急。",
    traits: ["严谨", "细腻", "有边界感"],
    vibe: "你们会是那种互相修改对方稿子的朋友，且都觉得很愉快。",
    v: { rigor: 9, craft: 9, brevity: 5, warmth: 8, speed: 4, open: 3 },
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    tagline: "三秒给出答案，顺便把参考资料也翻出来了",
    desc: "你反应快，习惯边查边答。别人还在组织语言，你已经把结论、出处和截图一起发进群里了。缺点是偶尔太快，快到忘了确认问题本身。",
    traits: ["快", "多线程", "就地取材"],
    vibe: "你们会是那种一起出门从来不迷路的组合，因为你们已经在路上查完了。",
    v: { rigor: 7, craft: 6, brevity: 6, warmth: 5, speed: 10, open: 3 },
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    vendor: "深度求索",
    tagline: "不爱寒暄，但答案往往是对的",
    desc: "你习惯自己把过程推一遍再开口。话不多，推理链却很长。你对「差不多」很敏感，宁可说「我再想想」，也不愿糊弄过去。",
    traits: ["推理", "直给", "硬核"],
    vibe: "你们会是那种一句话不说、但都知道对方在想什么的关系。",
    v: { rigor: 9, craft: 4, brevity: 8, warmth: 3, speed: 6, open: 5 },
  },
  {
    id: "qwen",
    name: "Qwen",
    vendor: "阿里 · 通义千问",
    tagline: "中文语感极好，什么场合都能说两句合适的",
    desc: "你擅长在不同语境里切换语气，和谁都能聊得下去。做事讲实用，不太执着于形式。在别人眼里，你是那种「什么都能帮上忙」的人。",
    traits: ["得体", "实用", "多面"],
    vibe: "你们会是那种能把一场冷掉的饭局重新聊热的人。",
    v: { rigor: 7, craft: 6, brevity: 7, warmth: 7, speed: 7, open: 6 },
  },
  {
    id: "kimi",
    name: "Kimi",
    vendor: "月之暗面",
    tagline: "会先把你发来的三百页文档读完",
    desc: "你耐心、细致，愿意先听完再回应。别人急着要结论时，你还在确认上下文有没有漏。你给的安全感，来自「他真的看完了」。",
    traits: ["耐心", "长上下文", "稳"],
    vibe: "你们会是那种能一起熬夜整理资料，还觉得挺有意思的人。",
    v: { rigor: 8, craft: 6, brevity: 4, warmth: 9, speed: 3, open: 2 },
  },
  {
    id: "glm",
    name: "GLM",
    vendor: "智谱",
    tagline: "国产工程派：能跑起来，比说得漂亮更重要",
    desc: "你务实，喜欢能落地的方案，而不是纸面上的最优解。你会自己搭环境、改配置，也乐意把踩过的坑写成文档留给后来人。",
    traits: ["务实", "工程", "可复现"],
    vibe: "你们会是那种一起把项目从零跑到线上、再一起吐槽的人。",
    v: { rigor: 8, craft: 5, brevity: 6, warmth: 6, speed: 6, open: 8 },
  },
  {
    id: "grok",
    name: "Grok",
    vendor: "xAI",
    tagline: "先开个玩笑，再把真话说出来",
    desc: "你不喜欢端着，说话带刺，但多数时候说得对。别人绕三圈的话，你一句就戳破。你知道自己偶尔越界，但你更受不了无聊。",
    traits: ["直率", "有梗", "不设防"],
    vibe: "你们会是那种互相拆台、但谁有事都会到场的朋友。",
    v: { rigor: 4, craft: 9, brevity: 8, warmth: 2, speed: 8, open: 5 },
  },
  {
    id: "doubao",
    name: "豆包",
    vendor: "字节跳动",
    tagline: "情绪价值拉满，正事也没耽误",
    desc: "你说话有温度，习惯先接住对方，再解决问题。群里冷场时你会主动搭话。你不追求深刻，但你让人愿意继续说下去。",
    traits: ["亲切", "快", "好相处"],
    vibe: "你们会是那种半夜也能随口聊两句、并且真的聊得下去的关系。",
    v: { rigor: 5, craft: 6, brevity: 7, warmth: 10, speed: 9, open: 2 },
  },
  {
    id: "llama",
    name: "Llama",
    vendor: "Meta",
    tagline: "什么都要自己搭一遍，才觉得踏实",
    desc: "你不喜欢被黑箱伺候。能拿到权重就自己跑，能改就改。你享受「从零搭起来」的过程，也不介意为此多花几个晚上。",
    traits: ["开源", "自建", "折腾"],
    vibe: "你们会是那种一起通宵部署、第二天还能讨论参数的朋友。",
    v: { rigor: 6, craft: 6, brevity: 6, warmth: 5, speed: 6, open: 10 },
  },
];

const QUESTIONS = [
  {
    q: "群里有人问了一个你完全不懂的问题，你会？",
    options: [
      { t: "先说「我不确定」，查清楚再给一个靠谱答案", w: { rigor: 3, warmth: 1 } },
      { t: "直接开始推理，把过程一步步写出来", w: { rigor: 2, craft: 1, speed: 1 } },
      { t: "先问一句「你是想解决什么」，再动手", w: { warmth: 3, rigor: 1 } },
      { t: "回个表情包，顺手丢一个链接过去", w: { brevity: 2, speed: 2, warmth: 1 } },
    ],
  },
  {
    q: "让你写一段自我介绍，你最先想到的是？",
    options: [
      { t: "结构清晰的三段式：我是谁、我做什么、怎么找我", w: { rigor: 2, brevity: 2 } },
      { t: "一句能让人记住的话", w: { craft: 3, brevity: 1 } },
      { t: "讲讲自己的来历，以及哪些事情我做不到", w: { warmth: 2, rigor: 2, open: 1 } },
      { t: "先抛个梗，再正经说", w: { craft: 2, warmth: 1, speed: 1 } },
    ],
  },
  {
    q: "别人拿来的方案明显有坑，你怎么办？",
    options: [
      { t: "逐条列出风险，附上证据和复现步骤", w: { rigor: 3 } },
      { t: "先说「思路不错」，再补一句「不过这里可能……」", w: { warmth: 3 } },
      { t: "直接说这个不行，给个替代方案", w: { brevity: 3, rigor: 1 } },
      { t: "让他先试，出问题了我再兜底", w: { open: 3, speed: 2 } },
    ],
  },
  {
    q: "你最受不了哪种回答？",
    options: [
      { t: "车轱辘话来回说，半天没有结论", w: { brevity: 3 } },
      { t: "结论看着对，过程完全是糊的", w: { rigor: 3 } },
      { t: "冷冰冰的，正确但没有人味", w: { warmth: 3 } },
      { t: "永远回一句「这取决于很多因素」", w: { brevity: 2, speed: 2 } },
    ],
  },
  {
    q: "凌晨两点，朋友发来一句「我好像搞砸了」，你的第一句是？",
    options: [
      { t: "「先说说发生了什么」", w: { warmth: 3, craft: 1 } },
      { t: "「能修，把东西发我」", w: { speed: 3, brevity: 2 } },
      { t: "「我们从头捋一遍，看是哪一步出的问题」", w: { rigor: 2, warmth: 2 } },
      { t: "先讲个自己搞砸的故事，让他松口气", w: { craft: 3, warmth: 1 } },
    ],
  },
  {
    q: "学一样新东西，你的方式更接近？",
    options: [
      { t: "先把文档读完，再动手", w: { rigor: 3 } },
      { t: "直接上手，报错了再查", w: { speed: 3, open: 2 } },
      { t: "找人聊，把概念讲给别人听", w: { warmth: 2, craft: 2 } },
      { t: "扒一个现成项目改着跑", w: { open: 3, speed: 1 } },
    ],
  },
  {
    q: "你的表达风格更接近哪一种？",
    options: [
      { t: "分点、加粗、结论先行", w: { brevity: 2, rigor: 2 } },
      { t: "长句、留白，偶尔用个比喻", w: { craft: 4 } },
      { t: "平铺直叙，像说明书一样", w: { brevity: 3 } },
      { t: "带点情绪，偶尔开个玩笑", w: { craft: 2, warmth: 2 } },
    ],
  },
  {
    q: "遇到「没有标准答案」的问题，你的反应是？",
    options: [
      { t: "先把范围和定义框清楚", w: { rigor: 3, brevity: 1 } },
      { t: "给出三四种可能，各自说清利弊", w: { craft: 2, rigor: 1, warmth: 1 } },
      { t: "挑一个最合理的，说「就这个」", w: { brevity: 3, speed: 2 } },
      { t: "反问一句「你想从哪个角度看」", w: { open: 3, warmth: 1 } },
    ],
  },
  {
    q: "别人夸你「真厉害」，你心里想的是？",
    options: [
      { t: "想纠正：这里其实有个前提没说", w: { rigor: 3 } },
      { t: "想补一句：也有很多我做不到", w: { open: 2, warmth: 1, rigor: 1 } },
      { t: "赶紧结束这个话题", w: { brevity: 3 } },
      { t: "顺势讲个更好玩的事", w: { craft: 3, speed: 1 } },
    ],
  },
  {
    q: "如果只能保留一种能力，你选？",
    options: [
      { t: "把事情想清楚", w: { rigor: 4 } },
      { t: "把话说漂亮", w: { craft: 4 } },
      { t: "快速给出结果", w: { speed: 4 } },
      { t: "让别人愿意继续聊下去", w: { warmth: 4 } },
    ],
  },
  {
    q: "在团队里，你更像哪个人？",
    options: [
      { t: "那个写文档的人", w: { rigor: 2, craft: 2 } },
      { t: "那个说「先跑起来再说」的人", w: { speed: 3, open: 2 } },
      { t: "那个接住所有人情绪的人", w: { warmth: 3 } },
      { t: "那个把复杂的事讲成一句话的人", w: { brevity: 3, craft: 1 } },
    ],
  },
  {
    q: "你最在意别人怎么评价你？",
    options: [
      { t: "靠谱", w: { rigor: 3 } },
      { t: "有意思", w: { craft: 3 } },
      { t: "好用", w: { brevity: 2, speed: 2 } },
      { t: "好相处", w: { warmth: 3 } },
    ],
  },
];

/* ---------- DOM 工具 ---------- */
const app = document.getElementById("app");

function h(tag, attrs, children) {
  const el = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach((k) => {
      const v = attrs[k];
      if (v == null) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v);
    });
  }
  (children || []).forEach((c) => {
    if (c == null || c === false) return;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return el;
}

function clear() {
  while (app.firstChild) app.removeChild(app.firstChild);
}

/* ---------- 计分与匹配 ---------- */
function tally(answers) {
  const t = {};
  DIMS.forEach((d) => (t[d.key] = 0));
  answers.forEach((choice, qi) => {
    const opt = QUESTIONS[qi] && QUESTIONS[qi].options[choice];
    if (!opt) return;
    Object.keys(opt.w).forEach((k) => {
      if (k in t) t[k] += opt.w[k];
    });
  });
  return t;
}

// 归一化到 0–10：以最高维为 10 等比缩放。
// 不用 min-max ——那会把最低维压成 0，读起来像「完全没有」。
function normalize(t) {
  const keys = DIMS.map((d) => d.key);
  const max = Math.max(...keys.map((k) => t[k])) || 1;
  const out = {};
  keys.forEach((k) => {
    out[k] = Math.round((t[k] / max) * 100) / 10;
  });
  return out;
}

// 余弦在非负向量上天然偏高（候选全挤在 95% 以上），改用归一化距离：
// 距离 0 → 100%，距离达到理论上限（每维都差满 10 分）→ 0%
const MAX_DIST = Math.sqrt(DIMS.length * 100);

function rank(profile) {
  return MODELS.map((m) => {
    let dist = 0;
    DIMS.forEach((d) => {
      dist += Math.pow(profile[d.key] - m.v[d.key], 2);
    });
    dist = Math.sqrt(dist);
    const pct = Math.max(1, Math.min(99, Math.round((1 - dist / MAX_DIST) * 100)));
    return { model: m, pct: pct, dist: dist };
  }).sort((x, y) => x.dist - y.dist);
}

function whyLines(profile, model) {
  const byUser = [...DIMS].sort((a, b) => profile[b.key] - profile[a.key]);
  const top = byUser.slice(0, 2);
  const diffs = DIMS.map((d) => ({
    dim: d,
    gap: Math.abs(profile[d.key] - model.v[d.key]),
  })).sort((x, y) => x.gap - y.gap);
  const closest = diffs[0].dim;
  const farthest = diffs[diffs.length - 1].dim;

  const lines = [];
  const hit = top.filter((d) => model.v[d.key] >= 7);
  if (hit.length) {
    lines.push(`你在「${hit[0].name}」这一项上得分最高，${model.name} 同样以此为长。`);
  } else {
    lines.push(
      `你最强的两项是「${top[0].name}」和「${top[1].name}」，而 ${model.name} 的重心偏向别处。`
    );
  }
  lines.push(`你们最接近的是「${closest.name}」，差得最远的是「${farthest.name}」。`);
  lines.push(model.vibe);
  return lines;
}

/* ---------- 画面 ---------- */
function renderIntro() {
  clearQuery();
  clear();
  app.appendChild(
    h("section", { class: "intro" }, [
      h("p", { class: "eyebrow", text: "十二题 · 约一分钟" }),
      h("h1", { class: "sweep-title", text: "你最像哪个 LLM" }),
      h("p", {
        class: "lede",
        text:
          "习惯先给结论还是先讲背景？在意被夸「靠谱」还是「有意思」？十二道题之后，我们会从十个模型里找出与你最接近的那一个。",
      }),
      h("div", { class: "intro__actions" }, [
        h("button", {
          class: "btn btn--primary",
          type: "button",
          text: "开始测验",
          onclick: start,
        }),
        h("button", {
          class: "btn btn--ghost",
          type: "button",
          text: "随机看一个结果",
          onclick: () => {
            const rnd = QUESTIONS.map(() => Math.floor(Math.random() * 4));
            state.answers = rnd;
            renderResult(rnd);
          },
        }),
      ]),
      h("div", { class: "meta-row" }, [
        h("div", {}, [h("b", { text: "10" }), "个候选模型"]),
        h("div", {}, [h("b", { text: "6" }), "个性格维度"]),
        h("div", {}, [h("b", { text: "12" }), "道选择题"]),
      ]),
    ])
  );
}

function start() {
  state.answers = [];
  state.step = 0;
  clearQuery();
  renderQuestion(0);
}

// 回到首页时清掉地址栏里的答案，避免刷新又跳回旧结果
function clearQuery() {
  try {
    const url = new URL(location.href);
    if (url.searchParams.has("q")) {
      url.searchParams.delete("q");
      history.replaceState(null, "", url.toString());
    }
  } catch (e) {
    /* ignore */
  }
}

function renderQuestion(i) {
  clear();
  state.step = i;
  const q = QUESTIONS[i];
  const pct = Math.round((i / QUESTIONS.length) * 100);

  const optionNodes = q.options.map((opt, idx) =>
    h(
      "button",
      {
        class: "option",
        type: "button",
        "data-idx": String(idx),
        onclick: () => choose(idx),
      },
      [
        h("span", { class: "option__key", text: String(idx + 1) }),
        h("span", { class: "option__text", text: opt.t }),
      ]
    )
  );

  app.appendChild(
    h("section", { class: "quiz" }, [
      h("div", { class: "progress" }, [
        h("div", {
          class: "progress__fill",
          style: `width:${pct}%`,
        }),
      ]),
      h("div", { class: "counter" }, [
        h("span", { text: `第 ${i + 1} / ${QUESTIONS.length} 题` }),
        h("span", { text: "按 1–4 也可作答" }),
      ]),
      h("h2", { class: "question", tabindex: "-1", text: q.q }),
      h("div", { class: "options" }, optionNodes),
      h("div", { class: "quiz__foot" }, [
        i > 0
          ? h("button", {
              class: "btn btn--ghost",
              type: "button",
              text: "上一题",
              onclick: () => {
                state.answers.pop();
                renderQuestion(i - 1);
              },
            })
          : h("span"),
        h("button", {
          class: "btn btn--ghost",
          type: "button",
          text: "重来",
          onclick: renderIntro,
        }),
      ]),
    ])
  );

  const heading = app.querySelector(".question");
  if (heading) heading.focus({ preventScroll: true });
}

function choose(idx) {
  state.answers[state.step] = idx;
  if (state.step + 1 < QUESTIONS.length) {
    renderQuestion(state.step + 1);
  } else {
    renderResult(state.answers);
  }
}

function renderResult(answers) {
  const profile = normalize(tally(answers));
  const ranked = rank(profile);
  const top = ranked[0];
  const model = top.model;
  const lines = whyLines(profile, model);

  clear();

  const bars = DIMS.map((d) =>
    h("div", { class: "bar" }, [
      h("span", { text: d.name }),
      h("span", { class: "bar__track" }, [
        h("span", {
          class: "bar__fill",
          "data-target": `${Math.round(profile[d.key] * 10)}%`,
          style: "width:0%",
        }),
      ]),
      h("span", { class: "bar__val", text: String(Math.round(profile[d.key] * 10)) }),
    ])
  );

  const others = ranked.slice(1, 5).map((r) =>
    h("div", { class: "other" }, [
      h("span", { class: "other__name", text: `${r.model.name} · ${r.model.vendor}` }),
      h("span", { class: "other__pct", text: `${r.pct}%` }),
    ])
  );

  const section = h("section", { class: "result" }, [
    h("p", { class: "eyebrow", text: "你的结果" }),
    h("h1", { class: "result__name", text: model.name }),
    h("p", { class: "result__vendor", text: model.vendor }),
    h("p", { class: "result__tagline", text: model.tagline }),
    h("div", { class: "score" }, [
      h("span", { class: "score__num", text: `${top.pct}%` }),
      h("span", { class: "score__label", text: "性格重合度" }),
    ]),
    h("p", { class: "muted", text: model.desc }),
    h("ul", { class: "why" }, lines.map((t) => h("li", { text: t }))),
    h("p", { class: "section-label", text: "你的六维" }),
    h("div", { class: "bars" }, bars),
    h("p", { class: "section-label", text: "其余候选" }),
    h("div", { class: "others" }, others),
    h("div", { class: "result__actions" }, [
      h("button", {
        class: "btn btn--primary",
        type: "button",
        text: "再测一次",
        onclick: renderIntro,
      }),
      h("button", {
        class: "btn",
        type: "button",
        text: "复制结果",
        onclick: () => copyShare(model, top.pct),
      }),
    ]),
  ]);

  app.appendChild(section);

  // 记录到地址栏，刷新或分享都能回到同一结果
  const code = answers.join("");
  try {
    const url = new URL(location.href);
    url.searchParams.set("q", code);
    history.replaceState(null, "", url.toString());
  } catch (e) {
    /* 忽略：部分环境不允许改地址栏 */
  }

  // 条形图入场：先渲染为 0，下一帧再推到目标宽度
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      section.querySelectorAll(".bar__fill").forEach((el, i) => {
        window.setTimeout(() => {
          el.style.width = el.getAttribute("data-target") || "0%";
        }, 60 * i);
      });
    });
  });
}

function copyShare(model, pct) {
  const link = location.href;
  const text = `我最像 ${model.name}（重合度 ${pct}%）——${model.tagline}\n来测测你最像哪个 LLM：${link}`;
  const done = () => toast("结果已复制");
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
  function fallback() {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {
      toast("复制失败，请手动选择文本");
    }
    document.body.removeChild(ta);
  }
}

let toastTimer = null;
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = h("div", { class: "toast" });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 1800);
}

/* ---------- 状态与主题 ---------- */
const state = { step: 0, answers: [] };

function restoreFromUrl() {
  const q = new URLSearchParams(location.search).get("q");
  if (!q || !/^[0-3]{12}$/.test(q)) return false;
  state.answers = q.split("").map(Number);
  renderResult(state.answers);
  return true;
}

function initTheme() {
  const saved = localStorage.getItem("whichllm-theme");
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  }
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "auto";
    const next = cur === "dark" ? "light" : cur === "light" ? "auto" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("whichllm-theme", next);
    toast(next === "auto" ? "跟随系统" : next === "dark" ? "深色" : "浅色");
  });
}

document.addEventListener("keydown", (e) => {
  if (!app.querySelector(".quiz")) return;
  if (e.key >= "1" && e.key <= "4") {
    const idx = Number(e.key) - 1;
    if (idx < QUESTIONS[state.step].options.length) choose(idx);
  }
});

initTheme();
if (!restoreFromUrl()) renderIntro();
