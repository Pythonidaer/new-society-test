class JobTracker {
    constructor() {
        this.jobsContainer = document.getElementById('tracked-jobs');
        this.sessionMarkedJobs = new Set(); // Track jobs marked during the session
        this.blacklistedDomains = ["remoteok.com", "turing.com"]; // Define blacklisted domains
        this.initialize();
    }

    isBlacklisted(url) {
        try {
            const domain = new URL(url).hostname;
            return this.blacklistedDomains.some(blacklistedDomain => domain.includes(blacklistedDomain));
        } catch (error) {
            console.error(`Invalid URL encountered: ${url}`);
            return false;
        }
    }

    async initialize() {
        let storedJobs = localStorage.getItem('jobPostings');
        let existingJobs = storedJobs ? JSON.parse(storedJobs) : [];

        try {
            const response = await fetch('jobs.json');
            const data = await response.json();

            const newJobs = data.jobs
                .filter(job => !this.isBlacklisted(job.applyUrl))
                .map(job => ({
                    ...job,
                    marked: false,
                    id: this.generateUniqueId(),
                }));

            const mergedJobs = [
                ...existingJobs,
                ...newJobs.filter(newJob =>
                    !existingJobs.some(existingJob => existingJob.applyUrl === newJob.applyUrl)
                )
            ];

            localStorage.setItem('jobPostings', JSON.stringify(mergedJobs));
            this.renderJobs(mergedJobs.filter(job => !job.marked));
        } catch (error) {
            console.error('Error loading jobs:', error);
            this.renderJobs(existingJobs.filter(job => !job.marked));
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

        const activeJobs = jobs.filter(job => !job.marked);
        const sessionMarkedJobs = allJobs.filter(job => this.sessionMarkedJobs.has(job.id));

        const activeJobsContainer = document.createElement('div');
        activeJobsContainer.className = 'active-jobs';
        activeJobs.forEach(job => {
            activeJobsContainer.appendChild(this.createJobCard(job));
        });
        jobsSection.appendChild(activeJobsContainer);

        if (sessionMarkedJobs.length > 0) {
            const markedJobsContainer = document.createElement('div');
            markedJobsContainer.className = 'marked-jobs';

            const separator = document.createElement('div');
            separator.className = 'jobs-separator';
            separator.textContent = 'Marked for Deletion';
            markedJobsContainer.appendChild(separator);

            sessionMarkedJobs.forEach(job => {
                const jobCard = this.createJobCard(job);
                jobCard.classList.add('marked-temp');
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

        const updatedJobs = jobs.map(job => {
            if (job.id === jobId) {
                const isMarkedNow = !job.marked;

                if (isMarkedNow) {
                    this.sessionMarkedJobs.add(jobId);
                } else {
                    this.sessionMarkedJobs.delete(jobId);
                }

                return { ...job, marked: isMarkedNow };
            }
            return job;
        });

        localStorage.setItem('jobPostings', JSON.stringify(updatedJobs));
        this.renderJobs(updatedJobs.filter(job => !job.marked), updatedJobs);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JobTracker();
});
