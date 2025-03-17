/**
 * Profile Image Swap - Alternates between normal and funny profile images
 * 
 * This script adds interactivity to the profile image:
 * - Changes to funny image after hovering for 3 seconds
 * - Changes to funny image immediately on click
 * - Returns to normal image after 1 second in both cases
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get the profile image element
  const profileImage = document.querySelector('.profile-image');
  
  if (!profileImage) return; // Exit if image not found
  
  // Store the original and funny image paths
  const originalImageSrc = '/images/jonatas-davi-paganini-profile-2025.png';
  const funnyImageSrc = '/images/jonatas-davi-paganini-profile-funny-2025.png';
  
  // Variable to store the hover timer
  let hoverTimer;
  
  // Function to swap to funny image
  function swapToFunnyImage() {
    profileImage.src = funnyImageSrc;
    
    // Set timer to swap back to original image after 1 second
    setTimeout(function() {
      profileImage.src = originalImageSrc;
    }, 1000);
  }
  
  // Add hover event listener
  profileImage.addEventListener('mouseenter', function() {
    // Start timer when mouse enters
    hoverTimer = setTimeout(function() {
      swapToFunnyImage();
    }, 3000); // 3 seconds hover delay
  });
  
  // Clear timer when mouse leaves
  profileImage.addEventListener('mouseleave', function() {
    clearTimeout(hoverTimer);
  });
  
  // Add click event listener for immediate swap
  profileImage.addEventListener('click', function() {
    // Clear any existing hover timer
    clearTimeout(hoverTimer);
    
    // Swap to funny image immediately
    swapToFunnyImage();
  });
}); 