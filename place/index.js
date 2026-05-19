function showImage(floorId) {
  const images = document.querySelectorAll('.content img');
  images.forEach(img => img.classList.remove('active'));
  document.getElementById(floorId).classList.add('active');
}
