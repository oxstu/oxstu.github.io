(function () {
  var root = document.documentElement;
  var saved = localStorage.getItem("pz-theme");
  if (saved) root.setAttribute("data-theme", saved);
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
    root.setAttribute("data-theme", "dark");
  function bind(){
    var b = document.getElementById("themeBtn");
    if (!b) return;
    b.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("pz-theme", next);
    });
  }
  if (document.readyState !== "loading") bind();
  else document.addEventListener("DOMContentLoaded", bind);
})();

/* projects: selected / all filter */
(function () {
  function bind(){
    var sec = document.getElementById("projects");
    if (!sec) return;
    var btns = sec.querySelectorAll(".proj-filter button");
    if (!btns.length) return;
    var label = document.getElementById("projTitle");
    var projects = sec.querySelectorAll(".project");

    function markLast(){
      var last = null;
      for (var i = 0; i < projects.length; i++) {
        projects[i].classList.remove("is-last");
        if (projects[i].offsetParent !== null) last = projects[i];
      }
      if (last) last.classList.add("is-last");
    }

    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        var mode = this.getAttribute("data-mode");
        sec.setAttribute("data-filter", mode);
        for (var j = 0; j < btns.length; j++)
          btns[j].setAttribute("aria-pressed", btns[j] === this ? "true" : "false");
        if (label) label.textContent = mode === "all" ? "Projects" : "Selected Projects";
        markLast();
      });
    }
    markLast();
  }
  if (document.readyState !== "loading") bind();
  else document.addEventListener("DOMContentLoaded", bind);
})();
