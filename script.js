const menuButton = document.querySelector(".menu-btn");
const menu = document.querySelector(".menu");

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    const open = menu.classList.toggle("open");

    menuButton.setAttribute(
      "aria-expanded",
      open ? "true" : "false"
    );
  });

  document.querySelectorAll(".menu a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}
