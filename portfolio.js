"use strict";

const assetPath = "assets/";
const projectsById = new Map(artwork.map((project) => [project.id, project]));
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]
));

const hero = document.querySelector("#hero");
const featured = Array.from(hero.querySelectorAll("[data-project]"), (print) => print.dataset.project);
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!motion.matches) {
  const prints = Array.from(hero.querySelectorAll(".art-window img"));
  Promise.allSettled(prints.map((image) => image.decode())).then(() => {
    if (!motion.matches) hero.classList.add("drawing");
  });
}

const orderedProjects = [
  ...featured.map((id) => projectsById.get(id)),
  ...artwork.filter((project) => !featured.includes(project.id)),
];
const categories = new Map(artwork.map((project) => [project.category, project.medium]));
const filters = document.querySelector("#filters");
const grid = document.querySelector("#projects");
const count = document.querySelector("#work-count");

function renderProjects(category) {
  const projects = orderedProjects.filter((project) => category === "all" || project.category === category);
  count.textContent = `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

  grid.innerHTML = projects.map((project) => {
    const image = project.images[0];
    const reference = String(artwork.indexOf(project) + 1).padStart(2, "0");
    const imageCount = `${project.images.length} ${project.images.length === 1 ? "image" : "images"}`;
    return `<article class="project" data-medium="${project.category}">
      <button type="button" class="project-button" data-project="${project.id}">
        <span class="project-image"><img src="${assetPath}${image.thumb}" alt="" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"></span>
        <span class="project-caption">
          <span class="eyebrow project-number">${reference}</span>
          <span class="project-description"><strong>${escapeHTML(project.title)}</strong><span>${escapeHTML(project.credit || project.medium)} · ${imageCount}</span></span>
          <span class="project-arrow" aria-hidden="true">↗</span>
        </span>
      </button>
    </article>`;
  }).join("");
}

filters.innerHTML = [["all", "All work"], ...categories].map(([id, label]) => (
  `<button type="button" data-category="${id}" aria-pressed="${id === "all"}">${escapeHTML(label)}</button>`
)).join("");
filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button || button.getAttribute("aria-pressed") === "true") return;
  filters.querySelector('[aria-pressed="true"]').setAttribute("aria-pressed", "false");
  button.setAttribute("aria-pressed", "true");
  renderProjects(button.dataset.category);
});
renderProjects("all");

const viewer = document.querySelector("#viewer");
const viewerTitle = document.querySelector("#viewer-title");
const viewerCredit = document.querySelector("#viewer-credit");
const viewerImage = document.querySelector("#viewer-image");
const viewerControls = document.querySelector("#viewer-controls");
const position = document.querySelector("#position");
const videoLink = document.querySelector("#video-link");
const imageLink = document.querySelector("#image-link");
let currentProject;
let currentIndex = 0;

function showImage(index) {
  const images = currentProject.images;
  currentIndex = (index + images.length) % images.length;
  const image = images[currentIndex];
  viewerImage.alt = `${currentProject.title}, artwork ${currentIndex + 1} of ${images.length}`;
  viewerImage.src = assetPath + image.file;
  imageLink.href = viewerImage.src;
  position.textContent = `${currentIndex + 1} / ${images.length}`;
}

document.querySelector("main").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-project]");
  if (!button) return;

  currentProject = projectsById.get(button.dataset.project);
  viewerTitle.textContent = currentProject.title;
  viewerCredit.textContent = [currentProject.medium, currentProject.credit].filter(Boolean).join(" · ");
  viewerControls.hidden = currentProject.images.length === 1;
  videoLink.hidden = !currentProject.video;
  if (currentProject.video) videoLink.href = currentProject.video;
  else videoLink.removeAttribute("href");
  showImage(Number(button.dataset.image || 0));
  viewer.showModal();
});

document.querySelector("#previous").addEventListener("click", () => showImage(currentIndex - 1));
document.querySelector("#next").addEventListener("click", () => showImage(currentIndex + 1));
viewer.addEventListener("keydown", (event) => {
  if (currentProject.images.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  showImage(currentIndex + (event.key === "ArrowLeft" ? -1 : 1));
});
viewer.addEventListener("click", (event) => {
  if (event.target === viewer) viewer.close();
});
