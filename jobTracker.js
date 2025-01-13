class JobTracker {
    constructor() {
        this.jobsContainer = document.getElementById('tracked-jobs');
        this.sessionMarkedJobs = new Set(); // Track jobs marked during the session
        this.blacklistedDomains = ["remoteok.com"]; // Define blacklisted domains
        this.initialize();
    }

    // Check if a URL matches a blacklisted domain
    isBlacklisted(url) {
        try {
            const domain = new URL(url).hostname; // Extract the hostname from the URL
            return this.blacklistedDomains.some(blacklistedDomain => domain.includes(blacklistedDomain));
        } catch (error) {
            console.error(`Invalid URL encountered: ${url}`);
            return false; // Treat invalid URLs as not blacklisted
        }
    }

    async initialize() {
        let storedJobs = localStorage.getItem('jobPostings');

        if (!storedJobs) {
            try {
                const response = await fetch('jobs.json');
                const data = await response.json();

                const initialJobs = data.jobs
                    .filter(job => !this.isBlacklisted(job.applyUrl)) // Exclude blacklisted jobs
                    .map(job => ({
                        ...job,
                        marked: false, // Default all jobs to unmarked
                        id: this.generateUniqueId(),
                    }));

                localStorage.setItem('jobPostings', JSON.stringify(initialJobs));
                this.renderJobs(initialJobs.filter(job => !job.marked)); // Render only unmarked jobs
            } catch (error) {
                console.error('Error loading initial jobs:', error);
            }
        } else {
            const jobs = JSON.parse(storedJobs);
            this.renderJobs(jobs.filter(job => !job.marked)); // Render only unmarked jobs
        }
    }

    generateUniqueId(existingIds = []) {
        let newId;
        do {
            newId = '_' + Math.random().toString(36).substring(2, 9);
        } while (existingIds.includes(newId));
        return newId;
    }

    renderJobs(jobs, allJobs = jobs) {
        this.jobsContainer.innerHTML = '';
        const jobsSection = document.createElement('div');
        jobsSection.className = 'job-cards';

        // Separate active and marked jobs
        const activeJobs = jobs.filter(job => !job.marked); // Jobs not marked
        const sessionMarkedJobs = allJobs.filter(job => this.sessionMarkedJobs.has(job.id)); // Session-marked jobs only

        // Render active jobs
        const activeJobsContainer = document.createElement('div');
        activeJobsContainer.className = 'active-jobs';
        activeJobs.forEach(job => {
            activeJobsContainer.appendChild(this.createJobCard(job));
        });
        jobsSection.appendChild(activeJobsContainer);

        // Render session-marked jobs (marked during this session)
        if (sessionMarkedJobs.length > 0) {
            const markedJobsContainer = document.createElement('div');
            markedJobsContainer.className = 'marked-jobs';

            const separator = document.createElement('div');
            separator.className = 'jobs-separator';
            separator.textContent = 'Marked for Deletion';
            markedJobsContainer.appendChild(separator);

            sessionMarkedJobs.forEach(job => {
                const jobCard = this.createJobCard(job);
                jobCard.classList.add('marked-temp'); // Apply temporary class
                markedJobsContainer.appendChild(jobCard);
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
        const jobs = JSON.parse(localStorage.getItem('jobPostings'));

        // Toggle the marked state for the specific job
        const updatedJobs = jobs.map(job => {
            if (job.id === jobId) {
                const isMarkedNow = !job.marked;

                // Update the session tracking set
                if (isMarkedNow) {
                    this.sessionMarkedJobs.add(jobId); // Add to session-marked jobs
                } else {
                    this.sessionMarkedJobs.delete(jobId); // Remove from session-marked jobs
                }

                return { ...job, marked: isMarkedNow };
            }
            return job;
        });

        // Save back to localStorage
        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));

        // Re-render jobs with updated session state
        this.renderJobs(updatedJobs.filter(job => !job.marked), updatedJobs);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JobTracker();
});
