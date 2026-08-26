let currentSlide = 0;

function initCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dotsContainer = document.querySelector('.carousel-dots');
  const carousel = document.querySelector('.carousel');

  if (!slides.length || !dotsContainer || !carousel) {
    return;
  }

  dotsContainer.replaceChildren();

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.classList.add('carousel-dot');
    dot.setAttribute('aria-label', `Show slide ${index + 1} of ${slides.length}`);
    dot.addEventListener('click', () => moveToSlide(index));
    dotsContainer.appendChild(dot);
  });

  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveSlide(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveSlide(1);
    }
  });

  updateCarousel();
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
  const track = document.querySelector('.carousel-container');
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');

  if (!track) {
    return;
  }

  track.style.transform = `translateX(-${currentSlide * 100}%)`;

  slides.forEach((slide, index) => {
    const isActive = index === currentSlide;
    slide.classList.toggle('active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
  });

  dots.forEach((dot, index) => {
    const isActive = index === currentSlide;
    dot.classList.toggle('active', isActive);
    if (isActive) {
      dot.setAttribute('aria-current', 'true');
    } else {
      dot.removeAttribute('aria-current');
    }
  });
}

window.addEventListener('load', initCarousel);
