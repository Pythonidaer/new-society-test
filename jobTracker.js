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
                const initialJobs = data.jobs.map(job => ({...job, marked: false}));
                localStorage.setItem('jobPostings', JSON.stringify(initialJobs));
                this.renderJobs(initialJobs);
            } catch (error) {
                console.error('Error loading initial jobs:', error);
            }
        } else {
            const jobs = JSON.parse(storedJobs);
            
            try {
                // Load new jobs and merge them
                const response = await fetch('jobs.json');
                const data = await response.json();
                const newJobs = data.jobs.map(job => ({...job, marked: false}));
                
                // Merge strategy: keep existing job states (marked/unmarked)
                const mergedJobs = newJobs.map(newJob => {
                    const existingJob = jobs.find(job => job.applyUrl === newJob.applyUrl);
                    return existingJob ? {...existingJob} : newJob;
                });

                localStorage.setItem('jobPostings', JSON.stringify(mergedJobs));
                this.renderJobs(mergedJobs);
            } catch (error) {
                console.error('Error fetching new jobs:', error);
                this.renderJobs(jobs);
            }
        }
    }

    async mergeNewJobs(newJobs, existingJobs = []) {
        const uniqueNewJobs = newJobs.filter(newJob => 
            !existingJobs.some(existingJob => existingJob.applyUrl === newJob.applyUrl)
        );

        const allJobs = [...existingJobs, ...uniqueNewJobs];
        localStorage.setItem('jobPostings', JSON.stringify(allJobs));
        this.renderJobs(allJobs);
    }

    renderJobs(jobs) {
        this.jobsContainer.innerHTML = '';
        const jobsSection = document.createElement('div');
        jobsSection.className = 'job-cards';

        // Current session marked vs unmarked jobs
        const activeJobs = jobs.filter(job => !job.marked);
        const markedJobs = jobs.filter(job => job.marked);

        // Render active jobs first
        activeJobs.forEach(job => {
            jobsSection.appendChild(this.createJobCard(job));
        });

        // Show marked jobs section if there are any in this session
        if (markedJobs.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'jobs-separator';
            separator.textContent = 'Recently Marked Jobs - Will be removed on refresh';
            jobsSection.appendChild(separator);

            markedJobs.forEach(job => {
                jobsSection.appendChild(this.createJobCard(job));
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
                <button class="mark-button ${job.marked ? 'marked' : ''}" 
                        data-url="${job.applyUrl}" 
                        title="${job.marked ? 'Unmark Job' : 'Mark as Reviewed'}"
                        aria-label="${job.marked ? 'Unmark Job' : 'Mark as Reviewed'}">
                    <span class="button-light" aria-hidden="true"></span>
                </button>
            </div>
        `;

        const markButton = card.querySelector('.mark-button');
        markButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleJobMark(job.applyUrl);
        });

        return card;
    }

    toggleJobMark(jobUrl) {
        // Get the current jobs from localStorage
        const jobs = JSON.parse(localStorage.getItem('jobPostings'));
        
        // Map through jobs and toggle ONLY the job with the matching URL
        const updatedJobs = jobs.map(job => {
            if (job.applyUrl === jobUrl) {
                // Toggle the marked state ONLY for this specific job
                return { ...job, marked: !job.marked };
            }
            return job; // Return other jobs unchanged
        });
        
        // Update storage and re-render
        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        this.renderJobs(updatedJobs);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JobTracker();
});