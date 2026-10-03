function initKaTeX() {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", displayMode: true },
        { left: "\\[", right: "\\]", displayMode: true },
        { left: "\\(", right: "\\)", displayMode: false },
        { left: "$", right: "$", displayMode: false }
      ],
      throwOnError: false
    });
  }
}

const katexScript = document.getElementById("katex-render");
if (katexScript) {
  katexScript.addEventListener("load", initKaTeX);
}
if (document.readyState === "complete" || document.readyState === "interactive") {
  initKaTeX();
} else {
  document.addEventListener("DOMContentLoaded", initKaTeX);
}
