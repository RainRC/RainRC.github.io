/* 睦头 Bot 文档站交互脚本：标题扫光 + 指令点击复制 + 指令过滤 */

/* 尽早打标记，让 CSS 在首次绘制前就把标题裁切掉，避免闪一下 */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) document.documentElement.classList.add("sweep-js");
})();

(function () {
  "use strict";

  var toastEl = null;
  var toastTimer = null;

  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "copy-toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 1600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // http 环境下 clipboard API 不可用，回退到 execCommand
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("code.cmd");
    if (!el) return;
    var text = el.getAttribute("data-cmd") || el.textContent.trim();
    copyText(text)
      .then(function () {
        toast("已复制 " + text);
      })
      .catch(function () {
        toast("复制失败，请手动选择文本");
      });
  });

  function initFilter() {
    var input = document.getElementById("cmd-filter");
    if (!input) return;

    var sections = Array.prototype.slice.call(
      document.querySelectorAll(".cmd-section")
    );

    var timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var q = input.value.trim().toLowerCase();
        var total = 0;

        sections.forEach(function (sec) {
          var rows = sec.querySelectorAll("table tbody tr");
          var visible = 0;
          Array.prototype.forEach.call(rows, function (tr) {
            var hit = !q || tr.textContent.toLowerCase().indexOf(q) !== -1;
            tr.style.display = hit ? "" : "none";
            if (hit) visible++;
          });
          sec.style.display = visible > 0 || !q ? "" : "none";
          total += visible;
        });

        // 没有匹配时给个提示
        var tip = document.getElementById("cmd-filter-empty");
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "cmd-filter-empty";
          tip.style.cssText = "color:var(--doc-muted);font-size:.9rem;";
          input.parentNode.insertBefore(tip, input.nextSibling);
        }
        if (q && total === 0) {
          tip.textContent = "没有匹配「" + input.value.trim() + "」的指令，试试别的关键字。";
        } else {
          tip.textContent = "";
        }
      }, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFilter);
  } else {
    initFilter();
  }

  // Material 的即时跳转会替换页面内容，重新绑定过滤框
  if (window.document$) {
    window.document$.subscribe(initFilter);
  }

  /* ---------- 标题扫光：进入视口时播放一次 ---------- */
  function initSweep() {
    if (!document.documentElement.classList.contains("sweep-js")) return;

    var heads = Array.prototype.slice.call(
      document.querySelectorAll(".md-typeset h1, .md-typeset h2")
    );
    if (!heads.length) return;

    var played = 0;

    function play(h) {
      if (h.classList.contains("is-sweeping") || h.classList.contains("is-swept")) return;
      played += 1;
      h.classList.add("is-sweeping");
      // 拉伸 0.4s + 收缩 0.3s，收尾后锁定终态
      window.setTimeout(function () {
        h.classList.remove("is-sweeping");
        h.classList.add("is-swept");
      }, 720);
    }

    var pending = heads.slice();

    function check() {
      if (!pending.length) return;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var rest = [];
      for (var i = 0; i < pending.length; i++) {
        var h = pending[i];
        var rect = h.getBoundingClientRect();
        // 已划过视口上方的也算"见过"，避免快速滚动时漏播
        if (rect.top < vh * 0.92) play(h);
        else rest.push(h);
      }
      pending = rest;
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        check();
      });
    }

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", check);

    // 兜底：若因脚本异常一条都没播到，3s 后直接显示，避免正文永久不可见
    window.setTimeout(function () {
      if (played === 0) {
        heads.forEach(function (h) {
          h.classList.add("is-swept");
        });
        pending = [];
      }
    }, 3000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSweep);
  } else {
    initSweep();
  }
})();
