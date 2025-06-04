function insertImageAbove(element, imageUrl) {
  var imageNode = document.createElement("img");
  imageNode.classList.add("custom_image");
  imageNode.src = imageUrl;
  imageNode.alt = "XNinja Fire";
  imageNode.style.width = "100px";
  imageNode.style.height = "100px";
  imageNode.style.display = "block";
  imageNode.style.marginBottom = "20px";

  element.parentNode.insertBefore(imageNode, element);
}

function callback(mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      var targetElements = document.querySelectorAll(".css-175oi2r.r-usiww2");
      targetElements.forEach((el) => {
        if (!el.previousSibling || !el.previousSibling.classList.contains("custom_image")) {
          insertImageAbove(
            el,
            "https://xninja.tech/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ffire.3b1add87.gif&w=256&q=75"
          );
        }
      });
    }
  }
}

var observer = new MutationObserver(callback);

observer.observe(document.body, { childList: true, subtree: true });

function insertRootDiv() {
  var rootDiv = document.createElement("div");
  rootDiv.id = "xninja-root";
  rootDiv.innerHTML = "XNinja loading...";
  document.body.insertBefore(rootDiv, document.body.firstChild);
}

insertRootDiv();
