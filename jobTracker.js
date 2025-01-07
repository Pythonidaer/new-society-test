class JobTracker {
    constructor() {
        this.jobsContainer = document.getElementById('tracked-jobs');
        this.initialize();
    }

    async initialize() {
        let storedJobs = localStorage.getItem('jobPostings');
        if (!storedJobs) {
            try {
                const response = await fetch('jobs.json');
                const data = await response.json();
                const jobsWithMarkedStatus = data.jobs.map(job => ({...job, marked: false}));
                localStorage.setItem('jobPostings', JSON.stringify(jobsWithMarkedStatus));
                this.renderJobs(jobsWithMarkedStatus);
            } catch (error) {
                console.error('Error loading initial jobs:', error);
            }
        } else {
            const jobs = JSON.parse(storedJobs);
            this.renderJobs(jobs);
        }
    }

    async addNewJobs(newJobs) {
        let storedJobs = JSON.parse(localStorage.getItem('jobPostings') || '[]');
        
        const jobsToAdd = newJobs.filter(newJob => 
            !storedJobs.some(job => job.applyUrl === newJob.applyUrl)
        ).map(job => ({...job, marked: false}));

        if (jobsToAdd.length > 0) {
            const updatedJobs = [...storedJobs, ...jobsToAdd];
            localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
            this.renderJobs(updatedJobs);
        }
    }

    renderJobs(jobs) {
        this.jobsContainer.innerHTML = '';
        const jobsSection = document.createElement('div');
        jobsSection.className = 'job-cards';

        // Separate unmarked and marked jobs
        const unmarkedJobs = jobs.filter(job => !job.marked);
        const markedJobs = jobs.filter(job => job.marked);

        // Render unmarked jobs first
        unmarkedJobs.forEach(job => {
            const card = this.createJobCard(job);
            jobsSection.appendChild(card);
        });

        // Add separator if there are marked jobs
        if (markedJobs.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'jobs-separator';
            separator.textContent = 'Marked Jobs';
            jobsSection.appendChild(separator);

            // Render marked jobs
            markedJobs.forEach(job => {
                const card = this.createJobCard(job);
                jobsSection.appendChild(card);
            });
        }

        this.jobsContainer.appendChild(jobsSection);
    }

    createJobCard(job) {
        const card = document.createElement('div');
        card.className = `job-card ${job.marked ? 'marked' : ''}`;
        
        card.innerHTML = `
            <div class="card-content">
                <div class="card-header">
                    <h3>${job.title}</h3>
                    <div class="job-meta">
                        <span class="company">${job.company}</span>
                        <span class="separator">•</span>
                        <span class="salary-range">${job.salaryRange}</span>
                        <span class="separator">•</span>
                        <span class="job-type">${job.jobType}</span>
                    </div>
                </div>
                <ul class="requirements">
                    ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>
            <div class="card-actions">
                <a href="${job.applyUrl}" class="job-link" target="_blank" rel="noopener noreferrer">Apply Now</a>
                <button class="mark-button ${job.marked ? 'marked' : ''}" data-url="${job.applyUrl}" title="${job.marked ? 'Unmark Job' : 'Mark as Reviewed'}">
                    <span class="button-light"></span>
                </button>
            </div>
        `;

        const markButton = card.querySelector('.mark-button');
        markButton.addEventListener('click', () => this.toggleJobMark(job.applyUrl));

        return card;
    }

    toggleJobMark(jobUrl) {
        const jobs = JSON.parse(localStorage.getItem('jobPostings'));
        const updatedJobs = jobs.map(job => {
            if (job.applyUrl === jobUrl) {
                return { ...job, marked: !job.marked };
            }
            return job;
        });
        
        // Update localStorage but don't remove marked jobs yet
        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        this.renderJobs(updatedJobs);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JobTracker();
});