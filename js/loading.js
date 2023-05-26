window.onload = function() {
    var events = document.querySelectorAll(".timeline-event");
  
    var isInViewport = function(element) {
      var rect = element.getBoundingClientRect();
      var windowHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.top >= 0 && rect.bottom <= windowHeight;
    };
  
    var handleVisibilityChange = function() {
      events.forEach(function(event) {
        if (isInViewport(event)) {
          event.classList.add("animate");
        }
      });
    };
  
    var throttleTimeout;
    var handleScroll = function() {
      clearTimeout(throttleTimeout);
      throttleTimeout = setTimeout(handleVisibilityChange, 50);
    };
  
    window.addEventListener("scroll", handleScroll);
    handleVisibilityChange();
  };
  