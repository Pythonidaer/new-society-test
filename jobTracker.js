class JobTracker {
    constructor() {
        this.jobsContainer = document.getElementById('tracked-jobs');
        this.initialize();
    }

    async initialize() {
        let storedJobs = localStorage.getItem('jobPostings');
        
        if (!storedJobs) {
            // Initial load when no jobs exist in storage
            try {
                const response = await fetch('jobs.json');
                const data = await response.json();
                const initialJobs = data.jobs.map(job => ({...job, marked: false}));
                localStorage.setItem('jobPostings', JSON.stringify(initialJobs));
                this.renderJobs(initialJobs);
            } catch (error) {
                console.error('Error loading initial jobs:', error);
            }
        } else {
            // Remove marked jobs before loading new ones
            const jobs = JSON.parse(storedJobs);
            const activeJobs = jobs.filter(job => !job.marked);
            
            try {
                // Fetch new jobs and merge with existing unmarked jobs
                const response = await fetch('jobs.json');
                const data = await response.json();
                await this.mergeNewJobs(data.jobs, activeJobs);
            } catch (error) {
                console.error('Error fetching new jobs:', error);
                this.renderJobs(activeJobs);
            }
        }
    }

    async mergeNewJobs(newJobs, existingJobs = []) {
        // Filter out any jobs that already exist in storage (checking by URL)
        const uniqueNewJobs = newJobs.filter(newJob => 
            !existingJobs.some(existingJob => existingJob.applyUrl === newJob.applyUrl)
        ).map(job => ({...job, marked: false}));

        if (uniqueNewJobs.length > 0) {
            const updatedJobs = [...existingJobs, ...uniqueNewJobs];
            localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
            this.renderJobs(updatedJobs);
            console.log(`Added ${uniqueNewJobs.length} new jobs to storage`);
        } else {
            localStorage.setItem('jobPostings', JSON.stringify(existingJobs));
            this.renderJobs(existingJobs);
            console.log('No new unique jobs to add');
        }
    }

    renderJobs(jobs) {
        this.jobsContainer.innerHTML = '';
        const jobsSection = document.createElement('div');
        jobsSection.className = 'job-cards';

        // Only render unmarked jobs
        const unmarkedJobs = jobs.filter(job => !job.marked);
        unmarkedJobs.forEach(job => {
            const card = this.createJobCard(job);
            jobsSection.appendChild(card);
        });

        this.jobsContainer.appendChild(jobsSection);
    }

    createJobCard(job) {
        const card = document.createElement('div');
        card.className = 'job-card';
        
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
                <button class="mark-button" data-url="${job.applyUrl}" title="Mark job as reviewed">
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
        const updatedJobs = jobs.filter(job => job.applyUrl !== jobUrl);
        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        this.renderJobs(updatedJobs);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tracker = new JobTracker();
});