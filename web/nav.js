// Load navigation dynamically
document.addEventListener('DOMContentLoaded', function() {
    fetch('nav.html')
        .then(response => response.text())
        .then(html => {
            const nav = document.querySelector('header nav');
            if (nav) {
                nav.innerHTML = html;

                // Prevent dropdown toggle links from navigating
                document.querySelectorAll('.dropdown-toggle').forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                    });
                });
            }
        })
        .catch(error => console.error('Error loading navigation:', error));
});
