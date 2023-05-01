const slider = document.querySelector('#slider');
const canvas = document.querySelector('#canvas');
slider.addEventListener('input', handleInputSlider);
const ctx = canvas.getContext('2d');
const images = {};
let startX, startY, moveX, moveY;
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);

window.addEventListener('load', () => loadSneaker(''));

function loadSneaker(sneaker) {
  let urlPrefix = ''
  let numImages = 0
  
  if (sneaker === 'AJ1-Cement') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-1-Retro-High-OG-White-Cement/Images/Air-Jordan-1-Retro-High-OG-White-Cement/Lv2/img'
    numImages = 36
  } else if (sneaker === 'AJ1-Denim-W') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-1-High-OG-Denim-W/Images/Air-Jordan-1-High-OG-Denim-W/Lv2/img'
    numImages = 36
  } else if (sneaker === 'AJ1-Visionaire') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-1-Retro-High-OG-Visionaire/Images/Air-Jordan-1-Retro-High-OG-Visionaire/Lv2/img'
    numImages = 36
  }else if (sneaker === 'AJ1-GoreTex-Berry') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-1-High-Element-Gore-Tex-Berry/Images/Air-Jordan-1-High-Element-Gore-Tex-Berry/Lv2/img'
    numImages = 36
  }else if (sneaker === 'AF1-Oreo') {
    urlPrefix = 'https://images.stockx.com/360/Nike-Air-Force-1-Flyknit-2-Black-Pure-Platinum/Images/Nike-Air-Force-1-Flyknit-2-Black-Pure-Platinum/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Jordan-33-Uni-Red') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-XXXIII-University-Red/Images/Air-Jordan-XXXIII-University-Red/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Air-Max-270-Orange-Blue') {
    urlPrefix = 'https://images.stockx.com/360/Nike-Air-Max-270-Flyknit-Laser-Orange-Blue-Orbit/Images/Nike-Air-Max-270-Flyknit-Laser-Orange-Blue-Orbit/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Air-Max-270-Bred') {
    urlPrefix = 'https://images.stockx.com/360/Nike-Air-Max-270-Flyknit-Bred/Images/Nike-Air-Max-270-Flyknit-Bred/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Epic-React-Flyknit-2-Blue-Void') {
    urlPrefix = 'https://images.stockx.com/360/Nike-Epic-React-Flyknit-2-Blue-Void/Images/Nike-Epic-React-Flyknit-2-Blue-Void/Lv2/img'
    numImages = 36
  }else {
    return
  }
  
  for (let i = 1; i <= numImages; i++) {
    const number = i.toString().padStart(2, '00')
    const url = `${urlPrefix}${number}.jpg?auto=format,compress&w=559&q=90&dpr=2&updated_at=1606327698`
    const image = new Image()
    image.src = url
    image.addEventListener('load', () => {
      images[i] = image
      if (i === 1) {
        loadImage(i)
      }
    })
  }
}

function loadImage(index) {
  ctx.drawImage(images[index], 0, 0, canvas.width, canvas.height)
}

function handleTouchStart(event) {
  event.preventDefault();
  startX = event.touches[0].pageX;
  startY = event.touches[0].pageY;
}

function handleTouchMove(event) {
  event.preventDefault();
  moveX = event.touches[0].pageX - startX;
  moveY = event.touches[0].pageY - startY;
  if (Math.abs(moveX) > Math.abs(moveY)) {
    // Horizontal swipe detected
    if (moveX > 0) {
      // Swipe right - rotate clockwise
      slider.value = parseInt(slider.value) + 1;
    } else {
      // Swipe left - rotate counterclockwise
      slider.value = parseInt(slider.value) - 1;
    }
    loadImage(slider.value);
  }
}

function handleInputSlider() {
  loadImage(this.value)
}