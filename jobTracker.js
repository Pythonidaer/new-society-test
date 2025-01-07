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
        
        // Merge new jobs, avoiding duplicates by URL
        const updatedJobs = [...storedJobs];
        newJobs.forEach(newJob => {
            if (!storedJobs.some(job => job.applyUrl === newJob.applyUrl)) {
                updatedJobs.push(newJob);
            }
        });

        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        this.renderJobs(updatedJobs);
    }

    renderJobs(jobs) {
        // Clear existing content
        this.jobsContainer.innerHTML = '';

        // Separate marked and unmarked jobs
        const unmarkedJobs = jobs.filter(job => !job.marked);
        const markedJobs = jobs.filter(job => job.marked);

        // Render unmarked jobs first
        unmarkedJobs.forEach(job => this.createJobCard(job, false));
        
        // Add a separator if there are both marked and unmarked jobs
        if (unmarkedJobs.length > 0 && markedJobs.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'jobs-separator';
            separator.textContent = 'Marked Jobs';
            this.jobsContainer.appendChild(separator);
        }

        // Render marked jobs
        markedJobs.forEach(job => this.createJobCard(job, true));
    }

    createJobCard(job, isMarked) {
        const card = document.createElement('div');
        card.className = `job-card ${isMarked ? 'marked' : ''}`;
        
        card.innerHTML = `
            <h3>${job.title}</h3>
            <div class="company">${job.company}</div>
            <ul class="requirements">
                ${job.requirements.map(req => `<li>${req}</li>`).join('')}
            </ul>
            <div class="salary-range">${job.salaryRange}</div>
            <div class="job-type">${job.jobType}</div>
            <a href="${job.applyUrl}" class="job-link" target="_blank" rel="noopener noreferrer">Apply Now</a>
            <button class="mark-button ${isMarked ? 'marked' : ''}" data-url="${job.applyUrl}">
                <span class="button-light"></span>
            </button>
        `;

        // Add click handler for the mark button
        const markButton = card.querySelector('.mark-button');
        markButton.addEventListener('click', () => this.toggleJobMark(job.applyUrl));

        this.jobsContainer.appendChild(card);
    }

    toggleJobMark(jobUrl) {
        const jobs = JSON.parse(localStorage.getItem('jobPostings'));
        const updatedJobs = jobs.map(job => {
            if (job.applyUrl === jobUrl) {
                return { ...job, marked: !job.marked };
            }
            return job;
        });

        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        this.renderJobs(updatedJobs);
    }
}

// Initialize the tracker when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new JobTracker();
});