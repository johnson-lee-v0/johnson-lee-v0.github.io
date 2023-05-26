window.onload = function() {
  var text = document.getElementById("animate-name");
  text.style.opacity = 0;

  var isInViewport = function(element) {
    var rect = element.getBoundingClientRect();
    var windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top >= 0 && rect.bottom <= windowHeight;
  };

  var animationInterval;
  var handleVisibilityChange = function() {
    if (isInViewport(text)) {
      var opacity = 0;
      clearInterval(animationInterval); // Clear any previous animation interval
      animationInterval = setInterval(function() {
        opacity += 0.1;
        text.style.opacity = opacity;
        if (opacity >= 1) {
          clearInterval(animationInterval);
        }
      }, 150);
    } else {
      clearInterval(animationInterval);
      text.style.opacity = 0;
    }
  };

  var throttleTimeout;
  var handleScroll = function() {
    clearTimeout(throttleTimeout);
    throttleTimeout = setTimeout(handleVisibilityChange, 200); // Throttle the event handler execution
  };

  window.addEventListener("scroll", handleScroll);
  handleVisibilityChange();
};
