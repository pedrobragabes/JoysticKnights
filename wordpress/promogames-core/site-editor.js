document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-media-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const picker = wp.media({ title: "Escolher imagem", library: { type: "image" }, multiple: false, button: { text: "Usar imagem" } });
      picker.on("select", () => { document.getElementById(button.dataset.mediaTarget).value = picker.state().get("selection").first().id; });
      picker.open();
    });
  });
  document.querySelectorAll("[data-media-clear]").forEach((button) => button.addEventListener("click", () => {
    document.getElementById(button.dataset.mediaClear).value = "";
  }));
});
