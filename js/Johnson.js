var images = [
    "image/PFP-Johnson Lee.png"
  ];
  
  var currentImage = 0;
  
  function changeImage() {
    currentImage++;
    if (currentImage >= images.length) {
      currentImage = 0;
    }
    document.getElementById("Johnson").src = images[currentImage];
  }
  
  setInterval(changeImage, 7000);
  