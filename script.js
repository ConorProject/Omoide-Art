
    // Basic interactivity for button selection
    document.addEventListener('DOMContentLoaded', function() {
        // Handle atmosphere button selection
        const styleButtons = document.querySelectorAll('.style-button');
        styleButtons.forEach(button => {
            button.addEventListener('click', function() {
                styleButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Handle feeling tag selection (allows multiple)
        const tagButtons = document.querySelectorAll('.tag-button');
        tagButtons.forEach(button => {
            button.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });

        // Prevent form submission for demo
        document.getElementById('omoide-form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Form submission would happen here - connect to your API to generate the image!');
        });
    });
