let allTools = [];

let currentCategory = "all";
let currentTag = "all";
let searchText = "";

let currentPage = 1;
const perPage = 6;

/* ---------------------------
   初期化
--------------------------- */

fetch("./tools.json")
  .then(res => {
    if (!res.ok) {
      throw new Error("tools.json の読み込みに失敗しました");
    }
    return res.json();
  })
  .then(data => {

    allTools = Array.isArray(data)
      ? data
      : [];

    generateFilters(allTools);

    applyFilters(true);

  })
  .catch(err => {

    console.error(err);

    document.getElementById("tool-list").innerHTML =
      "<p>ツール情報を読み込めませんでした。</p>";

  });

/* ---------------------------
   フィルタ生成
--------------------------- */

function generateFilters(tools) {

  const categories = new Set();
  const tags = new Set();

  tools.forEach(tool => {

    if (tool.category) {
      categories.add(tool.category);
    }

    if (Array.isArray(tool.tags)) {
      tool.tags.forEach(tag => tags.add(tag));
    }

  });

  createCategoryButtons(categories);
  createTagButtons(tags);

}

function createCategoryButtons(categories) {

  const container =
    document.getElementById("category-filter");

  container.innerHTML = "";

  const allBtn =
    createFilterButton("すべて", () => {

      currentCategory = "all";
      applyFilters(true);

    });

  container.appendChild(allBtn);

  categories.forEach(category => {

    const btn =
      createFilterButton(category, () => {

        currentCategory = category;
        applyFilters(true);

      });

    container.appendChild(btn);

  });

}

function createTagButtons(tags) {

  const container =
    document.getElementById("tag-filter");

  container.innerHTML = "";

  const allBtn =
    createFilterButton("全タグ", () => {

      currentTag = "all";
      applyFilters(true);

    });

  container.appendChild(allBtn);

  tags.forEach(tag => {

    const btn =
      createFilterButton(tag, () => {

        currentTag = tag;
        applyFilters(true);

      });

    container.appendChild(btn);

  });

}

function createFilterButton(text, callback) {

  const button =
    document.createElement("button");

  button.textContent = text;
  button.addEventListener("click", callback);

  return button;

}

/* ---------------------------
   フィルタ処理
--------------------------- */

function getFilteredTools() {

  let filtered = [...allTools];

  if (currentCategory !== "all") {

    filtered = filtered.filter(tool =>
      tool.category === currentCategory
    );

  }

  if (currentTag !== "all") {

    filtered = filtered.filter(tool =>
      Array.isArray(tool.tags) &&
      tool.tags.includes(currentTag)
    );

  }

  const keyword =
    searchText.trim().toLowerCase();

  if (keyword) {

    filtered = filtered.filter(tool => {

      const name =
        (tool.name || "").toLowerCase();

      const description =
        (tool.description || "").toLowerCase();

      const tags =
        Array.isArray(tool.tags)
          ? tool.tags.map(tag =>
              tag.toLowerCase()
            )
          : [];

      return (
        name.includes(keyword) ||
        description.includes(keyword) ||
        tags.some(tag =>
          tag.includes(keyword)
        )
      );

    });

  }

  return filtered;

}

function applyFilters(resetPage = true) {

  if (resetPage) {
    currentPage = 1;
  }

  renderTools(
    getFilteredTools()
  );

}

/* ---------------------------
   ツール描画
--------------------------- */

function renderTools(tools) {

  const list =
    document.getElementById("tool-list");

  list.innerHTML = "";

  const totalPages =
    Math.max(
      1,
      Math.ceil(tools.length / perPage)
    );

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start =
    (currentPage - 1) * perPage;

  const end =
    start + perPage;

  const pageItems =
    tools.slice(start, end);

  if (pageItems.length === 0) {

    list.innerHTML =
      "<p>該当するツールがありません。</p>";

    renderPagination(0);

    return;

  }

  pageItems.forEach(tool => {

    const card =
      document.createElement("div");

    card.className = "tool-card";

    const title =
      document.createElement("h3");

    title.textContent =
      tool.name || "名称未設定";

    const description =
      document.createElement("p");

    description.textContent =
      tool.description || "";

    const tags =
      document.createElement("small");

    tags.textContent =
      Array.isArray(tool.tags)
        ? tool.tags.join(", ")
        : "";

    const br =
      document.createElement("br");

    const link =
      document.createElement("a");

    link.href =
      tool.url || "#";

    link.textContent =
      "開く";

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(tags);
    card.appendChild(br);
    card.appendChild(link);

    list.appendChild(card);

  });

  renderPagination(tools.length);

}

/* ---------------------------
   ページネーション
--------------------------- */

function renderPagination(totalItems) {

  const container =
    document.getElementById("pagination");

  container.innerHTML = "";

  const totalPages =
    Math.ceil(totalItems / perPage);

  if (totalPages <= 1) {
    return;
  }

  if (currentPage > 1) {

    container.appendChild(
      createPageButton(
        "←",
        currentPage - 1
      )
    );

  }

  const pages =
    getVisiblePages(
      currentPage,
      totalPages
    );

  pages.forEach(page => {

    if (page === "...") {

      const span =
        document.createElement("span");

      span.textContent = "...";
      span.className = "page-ellipsis";

      container.appendChild(span);

      return;

    }

    const btn =
      createPageButton(
        page,
        page
      );

    if (page === currentPage) {
      btn.classList.add("active");
    }

    container.appendChild(btn);

  });

  if (currentPage < totalPages) {

    container.appendChild(
      createPageButton(
        "→",
        currentPage + 1
      )
    );

  }

}

function createPageButton(text, page) {

  const button =
    document.createElement("button");

  button.textContent = text;

  button.addEventListener(
    "click",
    () => changePage(page)
  );

  return button;

}

function getVisiblePages(
  current,
  total
) {

  const pages = [];

  if (total <= 7) {

    for (
      let i = 1;
      i <= total;
      i++
    ) {
      pages.push(i);
    }

    return pages;
  }

  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  pages.push(total);

  return pages;

}

function changePage(page) {

  const filtered =
    getFilteredTools();

  const maxPage =
    Math.max(
      1,
      Math.ceil(filtered.length / perPage)
    );

  currentPage =
    Math.min(
      Math.max(page, 1),
      maxPage
    );

  renderTools(filtered);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}

/* ---------------------------
   検索
--------------------------- */

document
  .getElementById("search")
  .addEventListener(
    "input",
    e => {

      searchText =
        e.target.value;

      applyFilters(true);

    }
  );
