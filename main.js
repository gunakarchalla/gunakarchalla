const navToggle = document.querySelector("#nav-toggle");
const navLinks = document.querySelector("#nav-links");
const navAnchors = document.querySelectorAll(".nav-links a");
const jumpTopButton = document.querySelector("#jump-top");
const scrollBar = document.querySelector("#scroll-bar");
const yearNode = document.querySelector("#year");
const roleRotatorNode = document.querySelector("#role-rotator");
const copyEmailButton = document.querySelector("#copy-email");
const copyNote = document.querySelector("#copy-note");
const languageSelect = document.querySelector("#lang-select");
const metaDescription = document.querySelector('meta[name="description"]');
const embeddedPortfolioContent = window.PORTFOLIO_CONTENT;

const defaultLanguage = "de";

let languageCycle = [defaultLanguage];
let translations = {};
let rotatingRoles = {};
let activeLanguage = defaultLanguage;
let roleIndex = 0;
let roleRotationTimer;

const languageNameByCode = {
    de: "Deutsch",
    en: "English",
    fr: "Francais",
    it: "Italiano"
};

const applyContentPayload = (payload) => {
    const loadedTranslations = payload?.translations;
    const loadedRotatingRoles = payload?.rotatingRoles;
    const loadedLanguageCycle = payload?.languageCycle;

    translations = loadedTranslations && typeof loadedTranslations === "object" ? loadedTranslations : {};
    rotatingRoles = loadedRotatingRoles && typeof loadedRotatingRoles === "object" ? loadedRotatingRoles : {};

    if (Array.isArray(loadedLanguageCycle) && loadedLanguageCycle.length) {
        languageCycle = loadedLanguageCycle;
        return;
    }

    const discoveredLanguages = Object.keys(translations);
    if (discoveredLanguages.length) {
        languageCycle = discoveredLanguages;
    }
};

const setNavOpen = (isOpen) => {
    if (!navToggle || !navLinks) {
        return;
    }

    navToggle.classList.toggle("open", isOpen);
    navLinks.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
};

const getLanguagePack = (language) => {
    if (translations[language]) {
        return translations[language];
    }

    if (translations[defaultLanguage]) {
        return translations[defaultLanguage];
    }

    const firstLanguage = Object.keys(translations)[0];
    return firstLanguage ? translations[firstLanguage] : {};
};

const updateRoleRotation = () => {
    if (!roleRotatorNode) {
        return;
    }

    const roleList = rotatingRoles[activeLanguage] || rotatingRoles[defaultLanguage] || [];
    if (!roleList.length) {
        roleRotatorNode.textContent = "";
        return;
    }

    roleIndex = 0;
    roleRotatorNode.textContent = roleList[roleIndex];

    if (roleRotationTimer) {
        clearInterval(roleRotationTimer);
    }

    roleRotationTimer = setInterval(() => {
        roleIndex = (roleIndex + 1) % roleList.length;
        roleRotatorNode.textContent = roleList[roleIndex];
    }, 2600);
};

const populateLanguageSelect = () => {
    if (!languageSelect) {
        return;
    }

    const fragment = document.createDocumentFragment();
    languageSelect.innerHTML = "";

    languageCycle.forEach((code) => {
        if (!translations[code]) {
            return;
        }

        const option = document.createElement("option");
        option.value = code;
        option.textContent = languageNameByCode[code] || code.toUpperCase();
        fragment.appendChild(option);
    });

    if (!fragment.childNodes.length) {
        const fallbackOption = document.createElement("option");
        fallbackOption.value = defaultLanguage;
        fallbackOption.textContent = languageNameByCode[defaultLanguage] || defaultLanguage.toUpperCase();
        fragment.appendChild(fallbackOption);
    }

    languageSelect.appendChild(fragment);
};

const applyLanguage = (requestedLanguage) => {
    const hasRequestedLanguage = languageCycle.includes(requestedLanguage) && translations[requestedLanguage];
    const selectedLanguage = hasRequestedLanguage ? requestedLanguage : defaultLanguage;
    const pack = getLanguagePack(selectedLanguage);

    activeLanguage = translations[selectedLanguage]
        ? selectedLanguage
        : Object.keys(translations).find((code) => translations[code]) || selectedLanguage;

    document.documentElement.lang = activeLanguage;

    if (pack["meta.title"]) {
        document.title = pack["meta.title"];
    }

    if (metaDescription && pack["meta.description"]) {
        metaDescription.setAttribute("content", pack["meta.description"]);
    }

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        const value = pack[key];
        if (!value) {
            return;
        }

        const targetAttr = element.dataset.i18nAttr;
        if (targetAttr) {
            element.setAttribute(targetAttr, value);
            return;
        }

        element.textContent = value;
    });

    if (jumpTopButton && pack["footer.jumpTopAria"]) {
        jumpTopButton.setAttribute("aria-label", pack["footer.jumpTopAria"]);
    }

    if (languageSelect) {
        languageSelect.value = activeLanguage;
        languageSelect.setAttribute("aria-label", pack["lang.switchLabel"] || "Switch language");
        languageSelect.setAttribute("title", pack["lang.switchLabel"] || "Switch language");
    }

    updateRoleRotation();
};

const updateScrollState = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollRange = doc.scrollHeight - doc.clientHeight;
    const progress = scrollRange > 0 ? (scrollTop / scrollRange) * 100 : 0;

    if (scrollBar) {
        scrollBar.style.width = `${progress}%`;
    }

    if (jumpTopButton) {
        jumpTopButton.classList.toggle("visible", scrollTop > 420);
    }

    const sections = ["about", "experience", "projects", "skills", "contact"];
    sections.forEach((id) => {
        const section = document.getElementById(id);
        const link = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (!section || !link) {
            return;
        }

        const rect = section.getBoundingClientRect();
        const inView = rect.top <= 160 && rect.bottom >= 160;
        link.classList.toggle("active", inView);
    });
};

const fetchContent = async () => {
    try {
        const response = await fetch("./data.json");
        if (!response.ok) {
            throw new Error(`Failed to fetch data.json: ${response.status}`);
        }

        const payload = await response.json();
        applyContentPayload(payload);
    } catch (error) {
        if (embeddedPortfolioContent && typeof embeddedPortfolioContent === "object") {
            applyContentPayload(embeddedPortfolioContent);
            return;
        }

        throw error;
    }
};

if (navToggle) {
    navToggle.addEventListener("click", () => {
        const isOpen = !navLinks.classList.contains("open");
        setNavOpen(isOpen);
    });
}

navAnchors.forEach((anchor) => {
    anchor.addEventListener("click", () => setNavOpen(false));
});

document.addEventListener("click", (event) => {
    if (!navLinks || !navToggle || !navLinks.classList.contains("open")) {
        return;
    }

    if (navLinks.contains(event.target) || navToggle.contains(event.target)) {
        return;
    }

    setNavOpen(false);
});

const revealObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
        });
    },
    { threshold: 0.2 }
);

document.querySelectorAll(".reveal").forEach((section) => {
    revealObserver.observe(section);
});

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);

if (jumpTopButton) {
    jumpTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// Ensure any "Back to top" anchor reliably scrolls to the top
document.querySelectorAll('a[href="#top"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});

if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
}

if (languageSelect) {
    languageSelect.addEventListener("change", (event) => {
        applyLanguage(event.target.value);
    });
}

if (copyEmailButton && copyNote) {
    copyEmailButton.addEventListener("click", async () => {
        const email = "gunakarchalla@gmail.com";

        try {
            await navigator.clipboard.writeText(email);
            copyNote.textContent = getLanguagePack(activeLanguage)["copy.success"] || "Email copied to clipboard.";
        } catch (error) {
            copyNote.textContent = getLanguagePack(activeLanguage)["copy.failure"] || "Copy failed. Please copy manually: gunakarchalla@gmail.com";
        }

        setTimeout(() => {
            copyNote.textContent = "";
        }, 2400);
    });
}

const init = async () => {
    try {
        await fetchContent();
        populateLanguageSelect();
        applyLanguage(defaultLanguage);
    } catch (error) {
        console.error("Unable to load portfolio content from data.json", error);
        populateLanguageSelect();
        applyLanguage(defaultLanguage);
    } finally {
        updateScrollState();
    }
};

init();
