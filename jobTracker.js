class JobTracker {
    constructor() {
        this.jobsContainer = document.getElementById('tracked-jobs');
        this.initialize();
    }

    async initialize() {
        let storedJobs = localStorage.getItem('jobPostings');
        if (!storedJobs) {
            // Fetch initial jobs if no stored jobs exist
            try {
                const response = await fetch('jobs.json');
                const data = await response.json();
                localStorage.setItem('jobPostings', JSON.stringify(data.jobs));
                this.renderJobs(data.jobs);
            } catch (error) {
                console.error('Error loading initial jobs:', error);
            }
        } else {
            // Use stored jobs
            const jobs = JSON.parse(storedJobs);
            this.renderJobs(jobs);
        }
    }

    async addNewJobs(newJobs) {
        let storedJobs = JSON.parse(localStorage.getItem('jobPostings') || '[]');
        
        // Only add jobs that don't exist in storage
        const jobsToAdd = newJobs.filter(newJob => 
            !storedJobs.some(job => job.applyUrl === newJob.applyUrl)
        );

        if (jobsToAdd.length > 0) {
            const updatedJobs = [...storedJobs, ...jobsToAdd];
            localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
            this.renderJobs(updatedJobs);
        }
    }

    renderJobs(jobs) {
        // Clear existing content
        this.jobsContainer.innerHTML = '';

        // Only display unmarked jobs
        jobs.forEach(job => this.createJobCard(job));
    }

    createJobCard(job) {
        const card = document.createElement('div');
        card.className = 'job-card';
        
        card.innerHTML = `
            <h3>${job.title}</h3>
            <div class="company">${job.company}</div>
            <ul class="requirements">
                ${job.requirements.map(req => `<li>${req}</li>`).join('')}
            </ul>
            <div class="salary-range">${job.salaryRange}</div>
            <div class="job-type">${job.jobType}</div>
            <a href="${job.applyUrl}" class="job-link" target="_blank" rel="noopener noreferrer">Apply Now</a>
            <button class="mark-button" data-url="${job.applyUrl}">
                <span class="button-light"></span>
            </button>
        `;

        // Add click handler for the mark button
        const markButton = card.querySelector('.mark-button');
        markButton.addEventListener('click', () => this.markJob(job.applyUrl));

        this.jobsContainer.appendChild(card);
    }

    markJob(jobUrl) {
        const jobs = JSON.parse(localStorage.getItem('jobPostings'));
        // Remove the marked job from storage instead of marking it
        const updatedJobs = jobs.filter(job => job.applyUrl !== jobUrl);
        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        this.renderJobs(updatedJobs);
    }
}

// Initialize the tracker when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new JobTracker();
});