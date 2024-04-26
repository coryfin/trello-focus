function waitForElement(selector) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (document.querySelector(selector)) {
      return resolve(element);
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function onListWrapperInserted(callback) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (!mutation.addedNodes?.length) {
        return;
      }
      mutation.addedNodes.forEach((addedNode) => {
        if (
          addedNode instanceof Element &&
          addedNode.getAttribute("data-testid") === "list-wrapper"
        ) {
          callback(addedNode);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

waitForElement(".board-wrapper").then((boardMainContent) => {
  // Turn on focus mode when a list is selected for focus
  chrome.storage.local.get("focusedList").then((result) => {
    if ("focusedList" in result) {
      boardMainContent.classList.add("focus-mode-on");
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes?.focusedList?.newValue) {
      boardMainContent.classList.add("focus-mode-on");
    } else if (changes?.focusedList?.oldValue) {
      boardMainContent.classList.remove("focus-mode-on");
    }
  });
});

waitForElement(".board-header-btns").then((boardHeaderButtons) => {
  insertShowAllButton(boardHeaderButtons);
});

onListWrapperInserted((listWrapper) => {
  insertFocusButton(listWrapper);

  const listId = listWrapper.getAttribute("data-list-id");

  chrome.storage.local.get("focusedList").then((result) => {
    if (result.focusedList === listId) {
      listWrapper.classList.add("focus-mode-focused");
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.focusedList?.newValue === listId) {
      listWrapper.classList.add("focus-mode-focused");
    }
  });
});

// Unmark the focused list whenever focus mode is removed
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.focusedList?.oldValue) {
    document.querySelectorAll(".focus-mode-focused").forEach((listWrapper) => {
      listWrapper.classList.remove("focus-mode-focused");
    });
  }
});

function insertFocusButton(listWrapper) {
  if (listWrapper.querySelector('[data-testid="focus-button"]')) {
    return;
  }

  const listEditMenuButton = listWrapper.querySelector(
    '[data-testid="list-edit-menu-button"]'
  );

  const focusButton = document.createElement("button");
  focusButton.className = listEditMenuButton.className;
  focusButton.setAttribute("data-testid", "focus-button");
  focusButton.innerHTML = `<span class="nch-icon A3PtEe1rGIm_yL neoUEAwI0GETBQ fAvkXZrzkeHLoc">
      <span data-testid="OverflowMenuHorizontalIcon" aria-hidden="true" class="css-snhnyn" style="--icon-primary-color: currentColor; --icon-secondary-color: inherit;">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M450-420q38 0 64-26t26-64q0-38-26-64t-64-26q-38 0-64 26t-26 64q0 38 26 64t64 26Zm193 160L538-365q-20 13-42.5 19t-45.5 6q-71 0-120.5-49.5T280-510q0-71 49.5-120.5T450-680q71 0 120.5 49.5T620-510q0 23-6.5 45.5T594-422l106 106-57 56ZM200-120q-33 0-56.5-23.5T120-200v-160h80v160h160v80H200Zm400 0v-80h160v-160h80v160q0 33-23.5 56.5T760-120H600ZM120-600v-160q0-33 23.5-56.5T200-840h160v80H200v160h-80Zm640 0v-160H600v-80h160q33 0 56.5 23.5T840-760v160h-80Z"/></svg>
      </span>
    </span>`;
  listEditMenuButton.insertAdjacentElement("beforebegin", focusButton);

  const listId = listWrapper.getAttribute("data-list-id");

  focusButton.addEventListener("click", () => {
    chrome.storage.local.set({ focusedList: listId });
  });
}

function insertShowAllButton(boardHeaderButtons) {
  const filtersButton = document.querySelector(
    '[data-testid="filter-popover-button"]'
  );

  const showAllButton = document.createElement("button");
  showAllButton.id = "show-all-lists";
  showAllButton.textContent = "Show all lists";
  showAllButton.className = filtersButton.className;
  boardHeaderButtons.insertAdjacentElement("afterbegin", showAllButton);

  showAllButton.addEventListener("click", () => {
    chrome.storage.local.remove("focusedList");
  });
}
