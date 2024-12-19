let currentSlide = 0;

function initCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dotsContainer = document.querySelector('.carousel-dots');

  // Dynamically create dots based on the number of slides
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('carousel-dot');
    dot.addEventListener('click', () => moveToSlide(index));
    dotsContainer.appendChild(dot);
  });

  updateCarousel(); // Ensure the first dot is active
}

function moveSlide(direction) {
  const slides = document.querySelectorAll('.carousel-slide');
  const totalSlides = slides.length;

  // Calculate the new slide index
  currentSlide = (currentSlide + direction + totalSlides) % totalSlides;

  updateCarousel();
}

function moveToSlide(index) {
  currentSlide = index;
  updateCarousel();
}

function updateCarousel() {
  const slides = document.querySelector('.carousel-container');
  const dots = document.querySelectorAll('.carousel-dot');

  // Update the container's transform property to show the current slide
  slides.style.transform = `translateX(-${currentSlide * 100}%)`;

  // Update the active dot
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

// Initialize the carousel on page load
window.addEventListener('load', initCarousel);
