// Small helpers for the Contoso Dentistry marketing site.

// Auto-update the copyright year in the footer.
document.addEventListener('DOMContentLoaded', () => {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    // Smoothly close any open nav on link click (mobile).
    document.querySelectorAll('.nav-links a').forEach((a) => {
        a.addEventListener('click', () => {
            // no-op placeholder; kept for future mobile menu toggle
        });
    });
});
