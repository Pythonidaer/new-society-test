class JobTracker {
    // tracked-jobs section, but not another section for 
    // within this is active-jobs div
    // however marked-jobs div is only created when clicked -- why?
    constructor() {
        this.jobsContainer = document.getElementById('tracked-jobs');
        this.initialize();
    }
    // Call this function
    async initialize() {
        let storedJobs = localStorage.getItem('jobPostings');
        
        if (!storedJobs) {
            // First-time load from JSON
            try {
                const response = await fetch('jobs.json');
                const data = await response.json();
                const initialJobs = data.jobs.map(job => ({
                    ...job, 
                    marked: false, // Default all jobs to not marked
                    id: this.generateUniqueId()
                }));
                localStorage.setItem('jobPostings', JSON.stringify(initialJobs));
                this.renderJobs(initialJobs);
            } catch (error) {
                console.error('Error loading initial jobs:', error);
            }
        } else {
            let jobs = JSON.parse(storedJobs);
    
            try {
                // Fetch new jobs from JSON
                const response = await fetch('jobs.json');
                const data = await response.json();
                
                // Merge existing jobs while avoiding duplicates
                const mergedJobs = data.jobs.map(newJob => {
                    const existingJob = jobs.find(job => job.applyUrl === newJob.applyUrl);
                    
                    // If the job exists, keep its current state (including marked)
                    if (existingJob) {
                        return { ...existingJob };
                    }
                    
                    // If no existing job, add it as new with default marked: false
                    return {
                        ...newJob,
                        marked: false,
                        id: this.generateUniqueId()
                    };
                });
    
                // Save all jobs (marked and unmarked) to localStorage
                localStorage.setItem('jobPostings', JSON.stringify(mergedJobs));
                this.renderJobs(mergedJobs);
            } catch (error) {
                console.error('Error fetching new jobs:', error);
                this.renderJobs(jobs);
            }
        }
    }
    

    generateUniqueId(existingIds = []) {
        let newId;
        do {
            newId = '_' + Math.random().toString(36).substring(2, 9);
        } while (existingIds.includes(newId));
        return newId;
    }

    renderJobs(jobs) {
        this.jobsContainer.innerHTML = '';
        const jobsSection = document.createElement('div');
        jobsSection.className = 'job-cards';

        // Separate marked and unmarked jobs
        const activeJobs = jobs.filter(job => !job.marked);
        const markedJobs = jobs.filter(job => job.marked);

        // Render active jobs
        const activeJobsContainer = document.createElement('div');
        activeJobsContainer.className = 'active-jobs';
        activeJobs.forEach(job => {
            activeJobsContainer.appendChild(this.createJobCard(job));
        });
        jobsSection.appendChild(activeJobsContainer);

        // Render marked jobs if any
        if (markedJobs.length > 0) {
            const markedJobsContainer = document.createElement('div');
            markedJobsContainer.className = 'marked-jobs';

            const separator = document.createElement('div');
            separator.className = 'jobs-separator';
            separator.textContent = 'Marked for Deletion';
            markedJobsContainer.appendChild(separator);

            markedJobs.forEach(job => {
                markedJobsContainer.appendChild(this.createJobCard(job));
            });

            jobsSection.appendChild(markedJobsContainer);
        }

        this.jobsContainer.appendChild(jobsSection);
    }

    createJobCard(job) {
        const card = document.createElement('div');
        card.className = `job-card ${job.marked ? 'marked' : ''}`; 
        card.dataset.id = job.id;
        
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
                        data-id="${job.id}" 
                        title="${job.marked ? 'Unmark Job' : 'Mark for Deletion'}"
                        aria-label="${job.marked ? 'Unmark Job' : 'Mark for Deletion'}">
                    <span class="button-light" aria-hidden="true"></span>
                </button>
            </div>
        `;

        const markButton = card.querySelector('.mark-button');
        markButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleJobMark(job.id);
        });

        return card;
    }

    toggleJobMark(jobId) {
        // Get the current jobs from localStorage
        const jobs = JSON.parse(localStorage.getItem('jobPostings'));
        
        // Map through jobs and toggle ONLY the job with the matching ID
        const updatedJobs = jobs.map(job => {
            if (job.id === jobId) {
                // Toggle the marked state ONLY for this specific job
                return { ...job, marked: !job.marked };
            }
            return job;
        });
        
        // Update storage and re-render
        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        this.renderJobs(updatedJobs);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JobTracker();
});