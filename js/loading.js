window.onload = function() {
    var text = document.getElementById("animate-name");
    text.style.opacity = 0;
  
    var timelineEvents = document.querySelectorAll(".timeline-event");
    var lastVisibleIndex = -1;
  
    var isInViewport = function(element) {
      var rect = element.getBoundingClientRect();
      var windowHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.top >= 0 && rect.bottom <= windowHeight;
    };
  
    var animateText = function() {
      if (isInViewport(text)) {
        var opacity = 0;
        var animationInterval = setInterval(function() {
          opacity += 0.1;
          text.style.opacity = opacity;
          if (opacity >= 1) {
            clearInterval(animationInterval);
          }
        }, 150);
      } else {
        text.style.opacity = 0;
      }
    };
  
    var animateTimelineEvents = function() {
      for (var i = 0; i < timelineEvents.length; i++) {
        if (isInViewport(timelineEvents[i])) {
          lastVisibleIndex = i;
        }
      }
  
      for (var j = 0; j <= lastVisibleIndex; j++) {
        var event = timelineEvents[j];
        if (!event.classList.contains("animate")) {
          event.classList.add("animate");
        }
      }
    };
  
    var handleVisibilityChange = function() {
      animateText();
      animateTimelineEvents();
    };
  
    var throttleTimeout;
    var handleScroll = function() {
      clearTimeout(throttleTimeout);
      throttleTimeout = setTimeout(handleVisibilityChange, 200);
    };
  
    window.addEventListener("scroll", handleScroll);
    handleVisibilityChange();
  };
  