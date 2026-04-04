/* ============================================
   AK Studio — Contact Page JS
   ============================================ */

function initContactPage() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const steps = form.querySelectorAll('.form-step');
    const progressSteps = form.querySelectorAll('.form-progress-step');
    const success = document.getElementById('formSuccess');
    let currentStep = 1;

    // Scramble the hero title
    const scrambleEl = document.getElementById('contactScramble');
    if (scrambleEl) {
        const scrambler = new TextScramble(scrambleEl);
        setTimeout(() => {
            scrambler.setText("Let's build something great.");
        }, 500);
    }

    // Navigate to a step
    function goToStep(step) {
        // Hide current
        steps.forEach(s => s.classList.remove('active'));
        progressSteps.forEach(s => {
            s.classList.remove('active');
            s.classList.remove('completed');
        });

        // Show target
        const target = form.querySelector(`[data-form-step="${step}"]`);
        if (target) {
            target.classList.remove('active');
            // Force reflow for animation
            void target.offsetWidth;
            target.classList.add('active');
        }

        // Update progress
        progressSteps.forEach(s => {
            const stepNum = parseInt(s.dataset.step);
            if (stepNum === step) {
                s.classList.add('active');
            } else if (stepNum < step) {
                s.classList.add('completed');
            }
        });

        currentStep = step;

        // Scroll to top of form
        window.scrollTo({
            top: form.offsetTop - 100,
            behavior: 'smooth'
        });
    }

    // Next buttons
    form.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            const nextStep = parseInt(btn.dataset.next);
            goToStep(nextStep);
        });
    });

    // Prev buttons
    form.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            const prevStep = parseInt(btn.dataset.prev);
            goToStep(prevStep);
        });
    });

    // Form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        });

        console.log('Form submission:', data);

        // Hide all steps, show success
        steps.forEach(s => s.classList.remove('active'));
        progressSteps.forEach(s => {
            s.classList.remove('active');
            s.classList.add('completed');
        });

        success.classList.add('active');
    });
}

document.addEventListener('DOMContentLoaded', initContactPage);
