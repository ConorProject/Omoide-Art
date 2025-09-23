
/**
 * Omoide Art - Frontend Form Handler
 * 
 * This script handles form submission, API communication, and image display
 * for the Omoide Art memory-to-artwork application.
 */

// Wait for the DOM to be fully loaded before running our script
document.addEventListener('DOMContentLoaded', function() {
    
    // Get references to key elements
    const form = document.getElementById('omoide-form');
    const submitButton = form.querySelector('.submit-button');

    // Initialize roll tracking system on page load
    initializeRollTracking();

    // Check for pre-populated form data from URL parameters
    checkForPrefilledData();

    // Add submit event listener to the form
    form.addEventListener('submit', async function(event) {
        // Prevent the default form submission behavior (page reload)
        event.preventDefault();

        try {
            // Gather all form data
            const formData = collectFormData();

            // Validate that we have all required data
            if (!validateFormData(formData)) {
                alert('Please fill in all fields and select at least one atmosphere and feeling.');
                return;
            }

            // Show loading state
            showLoadingState();

            // Update loading message for immediate gallery creation
            showNotification('Creating your Magic Link gallery...', 'info');

            // Send data to our backend API for immediate Magic Link generation
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // Check if the response is successful
            if (!response.ok) {
                // Try to get error details from response
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            // Parse the gallery creation response
            const galleryData = await response.json();

            // Check if we got a Magic Link
            if (!galleryData.success || !galleryData.galleryId) {
                throw new Error('Failed to create gallery');
            }

            console.log(`🎨 Gallery created immediately: ${galleryData.galleryId}`);
            console.log(`📝 Status: ${galleryData.status}`);
            showNotification('Gallery ready! Your artwork is being created. Redirecting...', 'success');

            // Add to localStorage collection before redirect
            addGalleryToLocalStorage(galleryData.galleryId);

            // Quick redirect since gallery is created immediately
            setTimeout(() => {
                window.location.href = `/gallery/${galleryData.galleryId}`;
            }, 800);

        } catch (error) {
            // Handle any errors that occurred
            console.error('Error creating gallery:', error);
            alert(`Sorry, something went wrong: ${error.message}. Please try again.`);

        } finally {
            // Always remove loading state, whether success or failure
            hideLoadingState();
        }
    });

    /**
     * Poll job status until completion and return image URLs
     * @param {string} jobId - The job ID to poll
     * @returns {Promise<Array>} Array of image URLs
     */
    async function pollJobStatus(jobId) {
        const maxWaitTime = 6 * 60 * 1000; // 6 minutes max
        const pollInterval = 15000; // 15 seconds between polls
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const response = await fetch(`/api/check-status?jobId=${encodeURIComponent(jobId)}`);

                if (!response.ok) {
                    throw new Error(`Status check failed: ${response.status}`);
                }

                const result = await response.json();

                if (result.status === 'completed') {
                    console.log('✅ Job completed successfully');
                    return result.imageUrls || [];
                } else if (result.status === 'failed') {
                    throw new Error(result.message || 'Image generation failed');
                } else {
                    // Still pending, show progress
                    const elapsed = Math.round((Date.now() - startTime) / 1000);
                    console.log(`⏳ Job in progress... (${elapsed}s elapsed)`);
                    showNotification(`Still creating your 4K artwork... (${elapsed}s elapsed)`, 'info');

                    // Wait before next poll
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }
            } catch (error) {
                console.error('Polling error:', error);
                // Continue polling unless it's been too long
                if (Date.now() - startTime > maxWaitTime - pollInterval) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }

        throw new Error('Image generation is taking longer than expected. Please try again.');
    }

    /**
     * Collects all form data and returns it as an object
     * @returns {Object} Form data object with all user inputs
     */
    function collectFormData() {
        // Get text inputs
        const location = document.getElementById('location').value.trim();
        const focus = document.getElementById('focus').value.trim();
        const detail = document.getElementById('detail').value.trim();
        
        // Get selected atmosphere (single selection)
        const activeAtmosphereButton = document.querySelector('.style-button.active');
        const atmosphere = activeAtmosphereButton ? activeAtmosphereButton.getAttribute('data-value') : null;
        
        // Get all selected feelings (multiple selection)
        const activeFeelingButtons = document.querySelectorAll('.tag-button.active');
        const feelings = Array.from(activeFeelingButtons).map(button => 
            button.getAttribute('data-value')
        );
        
        // Get selected aspect ratio (single selection)
        const activeAspectRatioButton = document.querySelector('.ar-btn.selected');
        const aspectRatio = activeAspectRatioButton ? activeAspectRatioButton.getAttribute('data-ar') : '1:1';

        // Get selected season
        const season = document.getElementById('selected-season').value;

        return {
            location,
            atmosphere,
            focus,
            detail,
            feelings,
            aspectRatio,
            season
        };
    }
    
    /**
     * Validates that all required form data is present
     * @param {Object} formData - The collected form data
     * @returns {boolean} True if valid, false otherwise
     */
    function validateFormData(formData) {
        return formData.location &&
               formData.atmosphere &&
               formData.focus &&
               formData.detail &&
               formData.feelings.length > 0;
    }
    
    /**
     * Shows loading state by disabling form and showing visual feedback
     */
    function showLoadingState() {
        // Add loading class to form for visual feedback
        form.classList.add('loading');
        
        // Disable the submit button and update its text
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Your Omoide...';
        
        // Gallery will show loading state automatically
    }
    
    /**
     * Hides loading state and re-enables form
     */
    function hideLoadingState() {
        // Remove loading class
        form.classList.remove('loading');
        
        // Re-enable submit button and restore text
        submitButton.disabled = false;
        submitButton.textContent = 'Create My Omoide';
    }
    
    /**
     * Displays the Artist's Quad gallery with 4 images
     * @param {Array} imageUrls - Array of 4 image URLs
     */
    function displayArtistQuad(imageUrls) {
        const gallerySection = document.getElementById('gallery-section');
        const galleryGrid = document.getElementById('gallery-grid');
        
        // Show the gallery section
        gallerySection.style.display = 'block';
        
        // Clear existing content and get gallery items
        const galleryItems = galleryGrid.querySelectorAll('.gallery-item');
        
        imageUrls.forEach((imageUrl, index) => {
            if (index < galleryItems.length) {
                const galleryItem = galleryItems[index];
                
                // Create image element
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = `Omoide artwork variation ${index + 1}`;
                
                // Add click handler for lightbox
                img.addEventListener('click', () => openLightbox(imageUrl));
                
                // Handle successful image load
                img.onload = function() {
                    // Remove loading state and add image
                    galleryItem.classList.remove('loading');
                    galleryItem.innerHTML = '';
                    galleryItem.appendChild(img);
                };
                
                // Handle image loading errors
                img.onerror = function() {
                    galleryItem.classList.remove('loading');
                    galleryItem.innerHTML = '<p>Failed to load</p>';
                };
            }
        });
    }
    
    /**
     * Opens the lightbox with the selected image
     * @param {string} imageUrl - URL of the image to display
     */
    function openLightbox(imageUrl) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        
        lightboxImage.src = imageUrl;
        lightbox.style.display = 'flex';
        
        // Add show class for animation
        setTimeout(() => {
            lightbox.classList.add('show');
        }, 10);
    }
    
    /**
     * Closes the lightbox
     */
    function closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('show');
        
        // Hide after animation
        setTimeout(() => {
            lightbox.style.display = 'none';
        }, 300);
    }
    
    // Also maintain the existing button interaction code
    // Handle atmosphere button selection (single selection)
    const styleButtons = document.querySelectorAll('.style-button');
    styleButtons.forEach(button => {
        button.addEventListener('click', function() {
            styleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Handle feeling tag selection (multiple selection)
    const tagButtons = document.querySelectorAll('.tag-button');
    tagButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
    
    // Handle aspect ratio button selection (single selection)
    const aspectRatioButtons = document.querySelectorAll('.ar-btn');
    aspectRatioButtons.forEach(button => {
        button.addEventListener('click', function() {
            aspectRatioButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Handle season selection (single selection)
    const seasonChoices = document.querySelectorAll('.season-choice');
    const selectedSeasonInput = document.getElementById('selected-season');

    seasonChoices.forEach(choice => {
        choice.addEventListener('click', function() {
            // Remove selected class from all choices
            seasonChoices.forEach(c => c.classList.remove('selected'));

            // Add selected class to clicked choice
            this.classList.add('selected');

            // Update hidden input value
            const seasonValue = this.getAttribute('data-season');
            selectedSeasonInput.value = seasonValue;
        });
    });
    
    // Lightbox event handlers
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightbox = document.getElementById('lightbox');
    const lightboxDownload = document.querySelector('.lightbox-download');
    
    // Close lightbox when clicking X
    lightboxClose.addEventListener('click', closeLightbox);
    
    // Close lightbox when clicking outside the content
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Close lightbox with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightbox.classList.contains('show')) {
            closeLightbox();
        }
    });
    
    // Download functionality
    lightboxDownload.addEventListener('click', function() {
        const lightboxImage = document.getElementById('lightbox-image');
        const link = document.createElement('a');
        link.href = lightboxImage.src;
        link.download = 'omoide-artwork.png';
        link.click();
    });

    /**
     * Initialize roll tracking system on page load
     * Checks sessionStorage for existing images and updates UI accordingly
     */
    function initializeRollTracking() {
        const storedImages = getStoredImages();

        if (storedImages.length > 0) {
            // Display existing images
            displayStoredImages(storedImages);

            // Update roll counter and button state
            updateRollCounter(storedImages.length);
        }
    }

    /**
     * Get stored images from sessionStorage
     * @returns {Array} Array of image URLs
     */
    function getStoredImages() {
        try {
            const stored = sessionStorage.getItem('omoideArtImages');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Error reading from sessionStorage:', error);
            return [];
        }
    }

    /**
     * Save images to sessionStorage
     * @param {Array} newImages - Array of new image URLs to add
     */
    function saveImagesToStorage(newImages, galleryId = null) {
        try {
            const existingImages = getStoredImages();

            // Create image objects with metadata
            const imageObjects = newImages.map((url, index) => ({
                url: url,
                galleryId: galleryId,
                timestamp: Date.now(),
                index: index
            }));

            const allImages = [...existingImages, ...imageObjects];
            sessionStorage.setItem('omoideArtImages', JSON.stringify(allImages));

            // Also save gallery ID for potential future use
            if (galleryId) {
                sessionStorage.setItem('lastGalleryId', galleryId);
            }

            console.log(`Saved ${newImages.length} new images to gallery ${galleryId}. Total: ${allImages.length}`);
        } catch (error) {
            console.warn('Error saving to sessionStorage:', error);
            alert('Images generated successfully but cannot be saved due to browser storage limits. Images will be lost on page refresh.');
        }
    }

    /**
     * Display stored images from previous rolls
     * @param {Array} imageUrls - Array of image URLs to display
     */
    function displayStoredImages(imageData) {
        const gallerySection = document.getElementById('gallery-section');
        const galleryGrid = document.getElementById('gallery-grid');

        // Show gallery section
        gallerySection.style.display = 'block';

        // Clear existing gallery items
        galleryGrid.innerHTML = '';

        // Create gallery items for all stored images
        imageData.forEach((item, index) => {
            // Handle both old format (just URLs) and new format (objects with metadata)
            const imageUrl = typeof item === 'string' ? item : item.url;
            const galleryId = typeof item === 'object' ? item.galleryId : null;

            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `Generated artwork ${index + 1}`;

            // Add click handler for lightbox (pass both URL and gallery ID)
            img.addEventListener('click', () => openLightbox(imageUrl, galleryId));

            galleryItem.appendChild(img);
            galleryGrid.appendChild(galleryItem);
        });
    }

    /**
     * Update roll counter and button state
     * @param {number} imageCount - Total number of images generated
     */
    function updateRollCounter(imageCount) {
        const rollsUsed = Math.ceil(imageCount / 4);
        const rollsRemaining = 3 - rollsUsed;

        // Update button text
        if (rollsRemaining > 0) {
            submitButton.textContent = `Create My Omoide (Roll ${rollsUsed + 1} of 3)`;
            submitButton.disabled = false;
        } else {
            submitButton.textContent = 'All 3 Rolls Used';
            submitButton.disabled = true;
        }

        // Update gallery title
        const galleryTitle = document.querySelector('#gallery-section h3');
        if (galleryTitle) {
            galleryTitle.textContent = `Your Images (${imageCount} total)`;
        }

        // Show/hide clear button
        const clearButton = document.getElementById('clear-images-btn');
        if (clearButton) {
            clearButton.style.display = imageCount > 0 ? 'inline-block' : 'none';
        }
    }

    /**
     * Clear all images from sessionStorage and reset the UI
     */
    function clearAllImages() {
        try {
            sessionStorage.removeItem('omoideArtImages');

            // Hide gallery section
            const gallerySection = document.getElementById('gallery-section');
            gallerySection.style.display = 'none';

            // Reset button text
            submitButton.textContent = 'Create My Omoide';
            submitButton.disabled = false;

            // Hide clear button
            const clearButton = document.getElementById('clear-images-btn');
            if (clearButton) {
                clearButton.style.display = 'none';
            }

            console.log('All images cleared from sessionStorage');
        } catch (error) {
            console.warn('Error clearing sessionStorage:', error);
        }
    }

    // Add event listener for clear images button
    const clearImagesBtn = document.getElementById('clear-images-btn');
    if (clearImagesBtn) {
        clearImagesBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all images? This cannot be undone.')) {
                clearAllImages();
            }
        });
    }

    /**
     * Show notification messages to the user
     * @param {string} message - The message to display
     * @param {string} type - Type of notification ('success', 'warning', 'error')
     */
    function showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.omoide-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification container with Japanese aesthetic
        const notification = document.createElement('div');
        notification.className = `omoide-notification omoide-notification-${type}`;

        // Create inner content with icon and text
        const content = document.createElement('div');
        content.className = 'omoide-notification-content';

        // Add appropriate icon based on type
        const icons = {
            success: '✨',
            warning: '⚠️',
            error: '🙏',
            info: '🎨'
        };

        const icon = document.createElement('span');
        icon.className = 'omoide-notification-icon';
        icon.textContent = icons[type] || icons.info;

        const text = document.createElement('span');
        text.className = 'omoide-notification-text';
        text.textContent = message;

        content.appendChild(icon);
        content.appendChild(text);
        notification.appendChild(content);

        // Japanese-inspired styling
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '12px',
            fontFamily: '"Noto Serif JP", serif',
            fontSize: '14px',
            fontWeight: '400',
            zIndex: '1000',
            maxWidth: '380px',
            minWidth: '280px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateX(calc(100% + 40px)) scale(0.9)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: '0'
        });

        // Style the content
        Object.assign(content.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        });

        Object.assign(icon.style, {
            fontSize: '18px',
            flexShrink: '0'
        });

        Object.assign(text.style, {
            lineHeight: '1.5',
            letterSpacing: '0.01em'
        });

        // Traditional Japanese colors with modern transparency
        const themes = {
            success: {
                background: 'linear-gradient(135deg, rgba(139, 195, 74, 0.9), rgba(104, 159, 56, 0.9))',
                color: '#1b5e20',
                borderColor: 'rgba(139, 195, 74, 0.3)'
            },
            warning: {
                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.9), rgba(255, 160, 0, 0.9))',
                color: '#e65100',
                borderColor: 'rgba(255, 193, 7, 0.3)'
            },
            error: {
                background: 'linear-gradient(135deg, rgba(229, 115, 115, 0.9), rgba(211, 47, 47, 0.9))',
                color: '#b71c1c',
                borderColor: 'rgba(229, 115, 115, 0.3)'
            },
            info: {
                background: 'linear-gradient(135deg, rgba(121, 134, 203, 0.9), rgba(63, 81, 181, 0.9))',
                color: '#1a237e',
                borderColor: 'rgba(121, 134, 203, 0.3)'
            }
        };

        const theme = themes[type] || themes.info;
        notification.style.background = theme.background;
        notification.style.color = theme.color;
        notification.style.borderColor = theme.borderColor;

        // Add subtle washi paper texture effect
        notification.style.backgroundImage = `
            ${theme.background},
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
        `;

        // Add to page
        document.body.appendChild(notification);

        // Elegant slide-in animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0) scale(1)';
            notification.style.opacity = '1';
        }, 50);

        // Auto remove with fade-out
        setTimeout(() => {
            notification.style.transform = 'translateX(calc(100% + 40px)) scale(0.95)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 400);
        }, type === 'error' ? 6000 : 4000);
    }

    /**
     * Show fallback message when AI service is unavailable
     * @param {Object} fallbackData - Fallback response data
     */
    function showFallbackMessage(fallbackData) {
        const gallerySection = document.getElementById('gallery-section');
        const galleryGrid = document.getElementById('gallery-grid');

        // Show the gallery section
        gallerySection.style.display = 'block';

        // Clear existing content
        galleryGrid.innerHTML = '';

        // Create fallback message container
        const fallbackContainer = document.createElement('div');
        fallbackContainer.className = 'fallback-message';

        fallbackContainer.innerHTML = `
            <div class="fallback-content">
                <div class="fallback-icon">🎨</div>
                <h3>AI Artists Taking a Break</h3>
                <p>${fallbackData.message}</p>
                <p class="fallback-suggestion">${fallbackData.suggestion}</p>
                <button class="retry-button" onclick="location.reload()">Try Again</button>
            </div>
        `;

        // Style the fallback message
        Object.assign(fallbackContainer.style, {
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '2px dashed #dee2e6',
            margin: '20px 0'
        });

        const fallbackContent = fallbackContainer.querySelector('.fallback-content');
        Object.assign(fallbackContent.style, {
            maxWidth: '400px',
            margin: '0 auto'
        });

        const icon = fallbackContainer.querySelector('.fallback-icon');
        Object.assign(icon.style, {
            fontSize: '48px',
            marginBottom: '16px'
        });

        const title = fallbackContainer.querySelector('h3');
        Object.assign(title.style, {
            color: '#333',
            marginBottom: '12px',
            fontSize: '24px'
        });

        const description = fallbackContainer.querySelector('p');
        Object.assign(description.style, {
            color: '#666',
            marginBottom: '8px',
            fontSize: '16px'
        });

        const suggestion = fallbackContainer.querySelector('.fallback-suggestion');
        Object.assign(suggestion.style, {
            color: '#999',
            fontStyle: 'italic',
            marginBottom: '20px',
            fontSize: '14px'
        });

        const retryButton = fallbackContainer.querySelector('.retry-button');
        Object.assign(retryButton.style, {
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
        });

        galleryGrid.appendChild(fallbackContainer);

        // Scroll to show the message
        gallerySection.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Show notification
        showNotification('Service temporarily unavailable. Please try again in a few minutes.', 'warning');
    }

    /**
     * Upload images to Vercel Blob storage for persistence
     */
    async function uploadImagesToBlobStorage(imageUrls) {
        try {
            const response = await fetch('/api/upload-images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrls: imageUrls,
                    galleryId: generateGalleryId()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Upload failed: ${response.status}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Blob upload error:', error);
            return {
                success: false,
                error: error.message,
                uploadedImages: [],
                galleryId: null
            };
        }
    }

    /**
     * Generate a unique gallery ID based on timestamp and random string
     */
    function generateGalleryId() {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `gallery-${timestamp}-${randomStr}`;
    }

    /**
     * Add gallery ID to localStorage collection tracking
     * @param {string} galleryId - The gallery ID to add
     */
    function addGalleryToLocalStorage(galleryId) {
        try {
            const existing = JSON.parse(localStorage.getItem('omoideGalleries') || '[]');
            if (!existing.includes(galleryId)) {
                existing.push(galleryId);
                localStorage.setItem('omoideGalleries', JSON.stringify(existing));
                console.log(`📝 Added gallery ${galleryId} to collection. Total: ${existing.length}`);
            }
        } catch (error) {
            console.warn('Error saving gallery to localStorage:', error);
        }
    }

    /**
     * Check for pre-populated form data from URL parameters
     * This allows users to return to a pre-filled form when clicking "Create Another Memory"
     */
    function checkForPrefilledData() {
        const urlParams = new URLSearchParams(window.location.search);
        const isPrefilled = urlParams.get('prefilled') === 'true';

        if (!isPrefilled) {
            return; // No pre-filled data
        }

        console.log('🔄 Detected pre-filled form data from URL parameters');

        // Pre-populate text fields
        const location = urlParams.get('location');
        const focus = urlParams.get('focus');
        const detail = urlParams.get('detail');

        if (location) {
            document.getElementById('location').value = location;
        }
        if (focus) {
            document.getElementById('focus').value = focus;
        }
        if (detail) {
            document.getElementById('detail').value = detail;
        }

        // Pre-select atmosphere button
        const atmosphere = urlParams.get('atmosphere');
        if (atmosphere) {
            const atmosphereButton = document.querySelector(`[data-value="${atmosphere}"]`);
            if (atmosphereButton && atmosphereButton.classList.contains('style-button')) {
                // Clear existing selections
                document.querySelectorAll('.style-button').forEach(btn => btn.classList.remove('active'));
                // Select the correct button
                atmosphereButton.classList.add('active');
            }
        }

        // Pre-select feeling tags (multiple selection)
        const feelings = urlParams.getAll('feelings');
        if (feelings.length > 0) {
            feelings.forEach(feeling => {
                const feelingButton = document.querySelector(`[data-value="${feeling}"]`);
                if (feelingButton && feelingButton.classList.contains('tag-button')) {
                    feelingButton.classList.add('active');
                }
            });
        }

        // Pre-select aspect ratio
        const aspectRatio = urlParams.get('aspectRatio');
        if (aspectRatio) {
            const aspectRatioButton = document.querySelector(`[data-ar="${aspectRatio}"]`);
            if (aspectRatioButton) {
                // Clear existing selections
                document.querySelectorAll('.ar-btn').forEach(btn => btn.classList.remove('selected'));
                // Select the correct button
                aspectRatioButton.classList.add('selected');
            }
        }

        // Pre-select season
        const season = urlParams.get('season');
        if (season) {
            const seasonChoice = document.querySelector(`[data-season="${season}"]`);
            if (seasonChoice) {
                // Clear existing selections
                document.querySelectorAll('.season-choice').forEach(choice => choice.classList.remove('selected'));
                // Select the correct choice
                seasonChoice.classList.add('selected');
                // Update hidden input
                document.getElementById('selected-season').value = season;
            }
        }

        // Show Clear Form button and notification
        showClearFormButton();
        showNotification('Form pre-filled with your previous inputs. You can modify them and create a new variation!', 'info');
    }

    /**
     * Show Clear Form button when pre-filled data is detected
     */
    function showClearFormButton() {
        // Check if clear button already exists
        let clearButton = document.getElementById('clear-form-btn');

        if (!clearButton) {
            // Create the clear button
            clearButton = document.createElement('button');
            clearButton.id = 'clear-form-btn';
            clearButton.type = 'button';
            clearButton.className = 'clear-form-button';
            clearButton.textContent = 'Clear Form';
            clearButton.title = 'Clear all pre-filled data and start fresh';

            // Style the button
            Object.assign(clearButton.style, {
                background: 'rgba(229, 115, 115, 0.1)',
                color: '#d32f2f',
                border: '2px solid #ffcdd2',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginLeft: '12px',
                fontFamily: 'inherit'
            });

            // Add hover effects
            clearButton.addEventListener('mouseenter', () => {
                clearButton.style.background = 'rgba(229, 115, 115, 0.2)';
                clearButton.style.borderColor = '#ef5350';
                clearButton.style.transform = 'translateY(-1px)';
            });

            clearButton.addEventListener('mouseleave', () => {
                clearButton.style.background = 'rgba(229, 115, 115, 0.1)';
                clearButton.style.borderColor = '#ffcdd2';
                clearButton.style.transform = 'translateY(0)';
            });

            // Add click handler
            clearButton.addEventListener('click', clearFormData);

            // Insert next to submit button
            const submitButton = document.querySelector('.submit-button');
            if (submitButton && submitButton.parentNode) {
                submitButton.parentNode.insertBefore(clearButton, submitButton.nextSibling);
            }
        }

        clearButton.style.display = 'inline-block';
    }

    /**
     * Clear all form data and return to fresh state
     */
    function clearFormData() {
        console.log('🧹 Clearing form data');

        // Clear text inputs
        document.getElementById('location').value = '';
        document.getElementById('focus').value = '';
        document.getElementById('detail').value = '';

        // Clear atmosphere selection
        document.querySelectorAll('.style-button').forEach(btn => btn.classList.remove('active'));

        // Clear feeling selections
        document.querySelectorAll('.tag-button').forEach(btn => btn.classList.remove('active'));

        // Reset aspect ratio to default (1:1)
        document.querySelectorAll('.ar-btn').forEach(btn => btn.classList.remove('selected'));
        const defaultAspectRatio = document.querySelector('[data-ar="1:1"]');
        if (defaultAspectRatio) {
            defaultAspectRatio.classList.add('selected');
        }

        // Clear season selection
        document.querySelectorAll('.season-choice').forEach(choice => choice.classList.remove('selected'));
        document.getElementById('selected-season').value = '';

        // Hide clear button
        const clearButton = document.getElementById('clear-form-btn');
        if (clearButton) {
            clearButton.style.display = 'none';
        }

        // Clear URL parameters (clean state)
        if (window.location.search) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }

        showNotification('Form cleared! Ready for a fresh memory.', 'success');
    }

});
