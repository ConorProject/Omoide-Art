
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
    const canvas = document.getElementById('canvas');
    
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
            
            // Send data to our backend API
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
            
            // Parse the successful response
            const data = await response.json();
            
            // Display the generated image
            displayGeneratedImage(data.imageUrl);
            
            // Scroll to the canvas to show the result
            canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
        } catch (error) {
            // Handle any errors that occurred
            console.error('Error generating image:', error);
            alert(`Sorry, something went wrong: ${error.message}. Please try again.`);
            
        } finally {
            // Always remove loading state, whether success or failure
            hideLoadingState();
        }
    });
    
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
        
        return {
            location,
            atmosphere,
            focus,
            detail,
            feelings
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
        
        // Add loading message to canvas
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.textContent = 'Your memory is being painted...';
        }
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
     * Displays the generated image in the canvas container
     * @param {string} imageUrl - URL of the generated image
     */
    function displayGeneratedImage(imageUrl) {
        // Clear any existing content in the canvas
        canvas.innerHTML = '';
        
        // Create new image element
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Your generated Omoide artwork';
        
        // Add loading handler for smooth appearance
        img.onload = function() {
            // Add the has-image class for proper styling
            canvas.classList.add('has-image');
        };
        
        // Handle image loading errors
        img.onerror = function() {
            canvas.innerHTML = '<p class="canvas-placeholder">Failed to load image. Please try again.</p>';
            canvas.classList.remove('has-image');
        };
        
        // Append image to canvas
        canvas.appendChild(img);
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
});
