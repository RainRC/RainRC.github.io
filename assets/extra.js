/* 睦头 Bot 文档站交互脚本：指令点击复制 + 指令过滤 */

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
})();
