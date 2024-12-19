/* Sneaker Data from JSON */
fetch('sneaker-data.json')
  .then(response => response.json())
  .then(data => {
    console.log(data); // Add this line
    const tableBody = document.querySelector('#data-table tbody');
    data.sneakers.forEach(sneaker => {
      const row = tableBody.insertRow();
      row.dataset.index = sneaker.id;
      row.onclick = () => {
        handleRowClick(row)
      }
      const nameCell = row.insertCell();
      nameCell.innerHTML = `<a href="#" onclick="loadSneaker('${sneaker['sneaker-name']}')">${sneaker['sneaker-name']}</a>`;
      const brandCell = row.insertCell();
      brandCell.innerText = sneaker.brand;
      const dateCell = row.insertCell();
      dateCell.innerText = sneaker['release-date'];
    });
  })
  .catch(error => console.error(error));

/* Canvas */
const slider = document.querySelector('#slider');
const canvas = document.querySelector('#canvas');
slider.addEventListener('input', handleInputSlider);
const ctx = canvas.getContext('2d');
const images = {};
let startX, startY, moveX, moveY;
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
window.addEventListener('load', () => loadSneaker('Air Jordan 1 High Skyline'));

function loadSneaker(sneaker) {
  let urlPrefix = ''
  let numImages = 0
  
  if (sneaker === 'Air Jordan 1 High Skyline') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-1-Retro-High-OG-Skyline/Images/Air-Jordan-1-Retro-High-OG-Skyline/Lv2/img'
    numImages = 36
  } else if (sneaker === 'Air Jordan 1 Retro High White Cement') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-1-Retro-High-OG-White-Cement/Images/Air-Jordan-1-Retro-High-OG-White-Cement/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Air Jordan 1 High OG Denim') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-1-High-OG-Denim-W/Images/Air-Jordan-1-High-OG-Denim-W/Lv2/img'
    numImages = 36
  } else if (sneaker === 'Air Jordan 1 Retro High OG Visionaire') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-1-Retro-High-OG-Visionaire/Images/Air-Jordan-1-Retro-High-OG-Visionaire/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Air Jordan 1 High Element Gore-Tex Berry') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-1-High-Element-Gore-Tex-Berry/Images/Air-Jordan-1-High-Element-Gore-Tex-Berry/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Nike Air Force 1 Flyknit 2 Black Pure Platinum') {
    urlPrefix = 'https://images.stockx.com/360/Nike-Air-Force-1-Flyknit-2-Black-Pure-Platinum/Images/Nike-Air-Force-1-Flyknit-2-Black-Pure-Platinum/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Jordan XXXIII University Red') {
    urlPrefix = 'https://images.stockx.com/360/Air-Jordan-XXXIII-University-Red/Images/Air-Jordan-XXXIII-University-Red/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Nike Air Max 270 Flyknit Laser Orange Blue Orbit') {
    urlPrefix = 'https://images.stockx.com/360/Nike-Air-Max-270-Flyknit-Laser-Orange-Blue-Orbit/Images/Nike-Air-Max-270-Flyknit-Laser-Orange-Blue-Orbit/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Nike Air Max 270 Flyknit Bred') {
    urlPrefix = 'https://images.stockx.com/360/Nike-Air-Max-270-Flyknit-Bred/Images/Nike-Air-Max-270-Flyknit-Bred/Lv2/img'
    numImages = 36
  }else if (sneaker === 'Nike Epic React Flyknit 2 Blue Void') {
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

/* Table */
function handleRowClick(row){
  const index = parseInt(row.dataset.index);
  if (index==0){
    loadSneaker('Nike Epic React Flyknit 2 Blue Void')
    // row.style.backgroundColor='#E6E6FA'
  }else if (index==1){
    loadSneaker('Nike Air Max 270 Flyknit Bred')
    // row.style.backgroundColor='#E6E6FA'
  }else if (index==2){
    loadSneaker('Nike Air Max 270 Flyknit Laser Orange Blue Orbit')
    // row.style.backgroundColor='#E6E6FA'
  }else if (index==3){
    loadSneaker('Jordan XXXIII University Red')
    // row.style.backgroundColor='#E6E6FA'
  }else if (index==4){
    loadSneaker('Nike Air Force 1 Flyknit 2 Black Pure Platinum')
    // row.style.backgroundColor='#E6E6FA'
  }else if (index==5){
    loadSneaker('Air Jordan 1 High Element Gore-Tex Berry')
    // row.style.backgroundColor='#E6E6FA'
  }else if (index==6){
    loadSneaker('Air Jordan 1 Retro High OG Visionaire')
    // row.style.backgroundColor='#E6E6FA'
  }else if (index==7){
    loadSneaker('Air Jordan 1 High OG Denim')
    // row.style.backgroundColor='#E6E6FA'
  }else if (index==8){
    loadSneaker('Air Jordan 1 High White Cement')
    // row.style.backgroundColor='#E6E6FA'
  }

}
